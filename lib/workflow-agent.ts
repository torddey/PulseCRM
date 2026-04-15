import { Prisma, WorkflowActor, WorkflowStage, WorkflowEventType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

type StageTransitionInput = {
  workflowId: string
  toStage: WorkflowStage
  actor?: WorkflowActor
  details?: string
  eventType?: WorkflowEventType
}

const STAGE_ORDER: WorkflowStage[] = [
  'INQUIRY',
  'OPTIONS_SENT',
  'BRIEF_PENDING',
  'BRIEF_LOCKED',
  'PAYMENT_PENDING',
  'PAID',
  'CONCEPTS_SENT',
  'CONCEPT_APPROVED',
  'PRODUCTION',
  'READY_TO_DELIVER',
  'DELIVERED',
  'FOLLOWUP_SENT',
]

const ALLOWED_TRANSITIONS: Record<WorkflowStage, WorkflowStage[]> = {
  INQUIRY: ['OPTIONS_SENT', 'BRIEF_PENDING'],
  OPTIONS_SENT: ['BRIEF_PENDING'],
  BRIEF_PENDING: ['BRIEF_LOCKED'],
  BRIEF_LOCKED: ['PAYMENT_PENDING', 'PAID'],
  PAYMENT_PENDING: ['PAID'],
  PAID: ['CONCEPTS_SENT'],
  CONCEPTS_SENT: ['CONCEPT_APPROVED'],
  CONCEPT_APPROVED: ['PRODUCTION'],
  PRODUCTION: ['READY_TO_DELIVER'],
  READY_TO_DELIVER: ['DELIVERED'],
  DELIVERED: ['FOLLOWUP_SENT'],
  FOLLOWUP_SENT: [],
}

const STAGE_SLA_HOURS: Partial<Record<WorkflowStage, number>> = {
  INQUIRY: 1,
  BRIEF_PENDING: 12,
  PAYMENT_PENDING: 24,
  CONCEPTS_SENT: 24,
  READY_TO_DELIVER: 8,
  DELIVERED: 24,
}

export async function getOrCreateClientWorkflow(clientId: string, title?: string) {
  const existing = await prisma.clientWorkflow.findFirst({
    where: {
      clientId,
      stage: {
        notIn: ['DELIVERED', 'FOLLOWUP_SENT'],
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  if (existing) return existing

  return prisma.clientWorkflow.create({
    data: {
      clientId,
      title: title || 'Client Service Workflow',
      stage: 'INQUIRY',
      stageOwner: 'AGENT',
      inquiryAt: new Date(),
      nextActionDueAt: computeSlaDeadline('INQUIRY'),
    },
  })
}

export function isValidStageTransition(fromStage: WorkflowStage, toStage: WorkflowStage) {
  return ALLOWED_TRANSITIONS[fromStage]?.includes(toStage) ?? false
}

export async function transitionWorkflowStage(input: StageTransitionInput) {
  return prisma.$transaction(async (tx) => {
    const workflow = await tx.clientWorkflow.findUnique({
      where: { id: input.workflowId },
    })

    if (!workflow) {
      throw new Error('Workflow not found')
    }

    if (!isValidStageTransition(workflow.stage, input.toStage)) {
      throw new Error(`Invalid transition from ${workflow.stage} to ${input.toStage}`)
    }

    const now = new Date()
    const stageTimestampUpdate = buildStageTimestampUpdate(input.toStage, now)

    const updatedWorkflow = await tx.clientWorkflow.update({
      where: { id: input.workflowId },
      data: {
        stage: input.toStage,
        stageOwner: input.actor ?? 'AGENT',
        stageUpdatedAt: now,
        nextActionDueAt: computeSlaDeadline(input.toStage, now),
        ...stageTimestampUpdate,
      },
    })

    await tx.workflowEvent.create({
      data: {
        workflowId: input.workflowId,
        eventType: input.eventType ?? 'STAGE_TRANSITION',
        fromStage: workflow.stage,
        toStage: input.toStage,
        actor: input.actor ?? 'AGENT',
        details: input.details ?? null,
      },
    })

    return updatedWorkflow
  })
}

export async function logInboundMessage(params: {
  workflowId: string
  body: string
  externalEventId?: string
}) {
  await prisma.$transaction(async (tx) => {
    await tx.workflowMessageLog.create({
      data: {
        workflowId: params.workflowId,
        direction: 'INBOUND',
        body: params.body,
      },
    })

    await tx.workflowEvent.create({
      data: {
        workflowId: params.workflowId,
        eventType: 'INBOUND_MESSAGE',
        actor: 'CLIENT',
        details: params.body.slice(0, 500),
        externalEventId: params.externalEventId ?? null,
      },
    })

    await tx.clientWorkflow.update({
      where: { id: params.workflowId },
      data: {
        lastInboundAt: new Date(),
      },
    })
  })
}

export async function sendWorkflowMessage(params: {
  workflowId: string
  clientPhone: string
  body: string
  templateKey?: string
}) {
  const result = await sendWhatsAppMessage(params.clientPhone, params.body)

  if (!result.success) {
    return result
  }

  await prisma.$transaction(async (tx) => {
    await tx.workflowMessageLog.create({
      data: {
        workflowId: params.workflowId,
        direction: 'OUTBOUND',
        body: params.body,
        templateKey: params.templateKey ?? null,
        messageSid: result.messageSid ?? null,
      },
    })

    await tx.workflowEvent.create({
      data: {
        workflowId: params.workflowId,
        eventType: 'OUTBOUND_MESSAGE',
        actor: 'AGENT',
        details: params.body.slice(0, 500),
      },
    })
  })

  return result
}

export async function applyWorkflowAutomation(params: {
  workflowId: string
  clientName: string
  clientPhone: string | null
}) {
  const workflow = await prisma.clientWorkflow.findUnique({
    where: { id: params.workflowId },
  })

  if (!workflow || !params.clientPhone) return

  const automatedMessage = getAutomatedMessageForStage(workflow.stage, params.clientName)
  if (!automatedMessage) return

  await sendWorkflowMessage({
    workflowId: workflow.id,
    clientPhone: params.clientPhone,
    body: automatedMessage.body,
    templateKey: automatedMessage.templateKey,
  })
}

export function getAutomatedMessageForStage(stage: WorkflowStage, clientName: string) {
  const messages: Partial<Record<WorkflowStage, { body: string; templateKey: string }>> = {
    OPTIONS_SENT: {
      templateKey: 'options_catalog',
      body: `Hi ${clientName}, thanks for reaching out. Here are curated options based on your request. Reply with your preferred option and we will guide you through the brief.`,
    },
    BRIEF_PENDING: {
      templateKey: 'brief_form',
      body: `Great choice, ${clientName}. Please share your design brief (style references, colors, dimensions, deadline, budget, and delivery details) so we can lock alignment before production.`,
    },
    PAID: {
      templateKey: 'payment_confirmed',
      body: `Payment confirmed, ${clientName}. Thank you. We are preparing 3 concept options and will share them with timeline updates shortly.`,
    },
    PRODUCTION: {
      templateKey: 'production_started',
      body: `Hi ${clientName}, production has started. We will keep communication light and send one milestone update before delivery.`,
    },
    READY_TO_DELIVER: {
      templateKey: 'pre_delivery_confirmation',
      body: `Your order is ready, ${clientName}. We will share delivery photo/proof and ETA for your confirmation before dispatch.`,
    },
    FOLLOWUP_SENT: {
      templateKey: 'retention_followup',
      body: `Hi ${clientName}, thanks for choosing us. We hope everything is perfect. Reply with feedback, and we can share reorder options and loyalty benefits.`,
    },
  }

  return messages[stage] ?? null
}

export function inferNextStageFromMessage(currentStage: WorkflowStage, message: string) {
  const normalized = message.toLowerCase()

  if (currentStage === 'INQUIRY' && /option|catalog|price|available/.test(normalized)) return 'OPTIONS_SENT'
  if ((currentStage === 'INQUIRY' || currentStage === 'OPTIONS_SENT') && /brief|design|reference|color/.test(normalized))
    return 'BRIEF_PENDING'
  if (currentStage === 'BRIEF_PENDING' && /confirm brief|approved brief|all details/.test(normalized))
    return 'BRIEF_LOCKED'
  if ((currentStage === 'BRIEF_LOCKED' || currentStage === 'PAYMENT_PENDING') && /paid|payment done|payment sent|transaction/.test(normalized))
    return 'PAID'
  if (currentStage === 'PAID' && /concept|option 1|option 2|option 3/.test(normalized)) return 'CONCEPTS_SENT'
  if (currentStage === 'CONCEPTS_SENT' && /approve|go with|selected option/.test(normalized)) return 'CONCEPT_APPROVED'
  if (currentStage === 'CONCEPT_APPROVED' && /start production|proceed/.test(normalized)) return 'PRODUCTION'
  if (currentStage === 'PRODUCTION' && /ready|done|completed/.test(normalized)) return 'READY_TO_DELIVER'
  if (currentStage === 'READY_TO_DELIVER' && /delivered|received/.test(normalized)) return 'DELIVERED'
  if (currentStage === 'DELIVERED' && /thank|great|satisfied|review/.test(normalized)) return 'FOLLOWUP_SENT'

  return null
}

export async function updateWorkflowBrief(
  workflowId: string,
  payload: {
    useCase?: string
    styleReferences?: string
    preferredColors?: string
    dimensions?: string
    deadline?: string
    budget?: string
    deliveryAddress?: string
    summary?: string
  }
) {
  return prisma.clientWorkflow.update({
    where: { id: workflowId },
    data: {
      briefUseCase: payload.useCase,
      briefStyleReferences: payload.styleReferences,
      briefPreferredColors: payload.preferredColors,
      briefDimensions: payload.dimensions,
      briefDeadline: payload.deadline ? new Date(payload.deadline) : undefined,
      briefBudget: payload.budget,
      briefDeliveryAddress: payload.deliveryAddress,
      briefSummary: payload.summary,
    },
  })
}

export async function confirmPaymentForWorkflow(workflowId: string, paymentReference?: string) {
  const workflow = await prisma.clientWorkflow.findUnique({ where: { id: workflowId } })
  if (!workflow) throw new Error('Workflow not found')

  if (workflow.stage !== 'PAYMENT_PENDING' && workflow.stage !== 'BRIEF_LOCKED') {
    throw new Error(`Cannot confirm payment from stage ${workflow.stage}`)
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date()
    const updated = await tx.clientWorkflow.update({
      where: { id: workflowId },
      data: {
        stage: 'PAID',
        stageOwner: 'SYSTEM',
        stageUpdatedAt: now,
        paidAt: now,
        paymentReference: paymentReference ?? null,
        nextActionDueAt: computeSlaDeadline('PAID', now),
      },
    })

    await tx.workflowEvent.create({
      data: {
        workflowId,
        eventType: 'PAYMENT_CONFIRMED',
        fromStage: workflow.stage,
        toStage: 'PAID',
        actor: 'SYSTEM',
        details: paymentReference ? `Payment confirmed: ${paymentReference}` : 'Payment confirmed',
      },
    })

    return updated
  })
}

export async function createStageFollowUpIfMissing(params: {
  clientId: string
  stage: WorkflowStage
  scheduledFor: Date
  title: string
  description: string
  method?: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'CALL' | 'IN_PERSON'
}) {
  const existing = await prisma.followUp.findFirst({
    where: {
      clientId: params.clientId,
      title: params.title,
      status: 'PENDING',
    },
  })
  if (existing) return existing

  return prisma.followUp.create({
    data: {
      clientId: params.clientId,
      title: params.title,
      description: params.description,
      scheduledFor: params.scheduledFor,
      method: params.method ?? 'WHATSAPP',
      status: 'PENDING',
      messageTemplate: `Stage reminder for ${params.stage}`,
    },
  })
}

export function computeWorkflowMetrics(data: {
  workflows: Array<{
    inquiryAt: Date | null
    paidAt: Date | null
    conceptsSentAt: Date | null
    conceptApprovedAt: Date | null
    readyToDeliverAt: Date | null
    deliveredAt: Date | null
    followUpSentAt: Date | null
    createdAt: Date
  }>
  complaintsAfterDelivery: number
}) {
  const workflows = data.workflows
  const paid = workflows.filter((w) => w.paidAt)
  const delivered = workflows.filter((w) => w.deliveredAt)

  const inquiryToPaymentConversion = workflows.length === 0 ? 0 : (paid.length / workflows.length) * 100

  const inquiryToPaidHours = averageHours(
    paid
      .filter((w) => w.inquiryAt && w.paidAt)
      .map((w) => [w.inquiryAt as Date, w.paidAt as Date])
  )

  const conceptCycleHours = averageHours(
    workflows
      .filter((w) => w.conceptsSentAt && w.conceptApprovedAt)
      .map((w) => [w.conceptsSentAt as Date, w.conceptApprovedAt as Date])
  )

  const onTimeDeliveryRate = delivered.length === 0 ? 0 : (workflows.filter((w) => w.readyToDeliverAt && w.deliveredAt).length / delivered.length) * 100
  const followupRate = delivered.length === 0 ? 0 : (workflows.filter((w) => w.followUpSentAt).length / delivered.length) * 100
  const complaintRateAfterDelivery = delivered.length === 0 ? 0 : (data.complaintsAfterDelivery / delivered.length) * 100

  return {
    inquiryToPaymentConversion: round2(inquiryToPaymentConversion),
    averageInquiryToPaidHours: round2(inquiryToPaidHours),
    averageConceptApprovalHours: round2(conceptCycleHours),
    onTimeDeliveryRate: round2(onTimeDeliveryRate),
    followupRate: round2(followupRate),
    complaintRateAfterDelivery: round2(complaintRateAfterDelivery),
  }
}

function buildStageTimestampUpdate(stage: WorkflowStage, now: Date): Prisma.ClientWorkflowUpdateInput {
  switch (stage) {
    case 'INQUIRY':
      return { inquiryAt: now }
    case 'OPTIONS_SENT':
      return { optionsSentAt: now }
    case 'BRIEF_PENDING':
      return { briefPendingAt: now }
    case 'BRIEF_LOCKED':
      return { briefLockedAt: now }
    case 'PAYMENT_PENDING':
      return { paymentPendingAt: now }
    case 'PAID':
      return { paidAt: now }
    case 'CONCEPTS_SENT':
      return { conceptsSentAt: now }
    case 'CONCEPT_APPROVED':
      return { conceptApprovedAt: now }
    case 'PRODUCTION':
      return { productionStartedAt: now }
    case 'READY_TO_DELIVER':
      return { readyToDeliverAt: now }
    case 'DELIVERED':
      return { deliveredAt: now }
    case 'FOLLOWUP_SENT':
      return { followUpSentAt: now }
    default:
      return {}
  }
}

function computeSlaDeadline(stage: WorkflowStage, fromDate = new Date()) {
  const hours = STAGE_SLA_HOURS[stage]
  if (!hours) return null
  return new Date(fromDate.getTime() + hours * 60 * 60 * 1000)
}

function averageHours(pairs: Array<[Date, Date]>) {
  if (pairs.length === 0) return 0
  const totalMs = pairs.reduce((sum, [start, end]) => sum + (end.getTime() - start.getTime()), 0)
  return totalMs / pairs.length / (1000 * 60 * 60)
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export function getStageProgress(stage: WorkflowStage) {
  const index = STAGE_ORDER.indexOf(stage)
  if (index < 0) return 0
  return Math.round(((index + 1) / STAGE_ORDER.length) * 100)
}
