import { NextRequest, NextResponse } from 'next/server'
import { WorkflowStage } from '@prisma/client'
import { prisma } from '@/lib/db'
import {
  applyWorkflowAutomation,
  confirmPaymentForWorkflow,
  getOrCreateClientWorkflow,
  transitionWorkflowStage,
  updateWorkflowBrief,
} from '@/lib/workflow-agent'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const stage = searchParams.get('stage')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const where: any = {}
    if (clientId) where.clientId = clientId
    if (stage) where.stage = stage

    const workflows = await prisma.clientWorkflow.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ success: true, data: workflows })
  } catch (error) {
    console.error('Error loading workflows:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action,
      clientId,
      workflowId,
      toStage,
      brief,
      paymentReference,
      actor = 'HUMAN',
      details,
      autoMessage = true,
    } = body

    if (action === 'init') {
      if (!clientId) {
        return NextResponse.json({ success: false, error: 'clientId is required' }, { status: 400 })
      }

      const workflow = await getOrCreateClientWorkflow(clientId)
      return NextResponse.json({ success: true, data: workflow }, { status: 201 })
    }

    if (!workflowId) {
      return NextResponse.json({ success: false, error: 'workflowId is required' }, { status: 400 })
    }

    const workflow = await prisma.clientWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 })
    }

    if (action === 'update-brief') {
      const updated = await updateWorkflowBrief(workflowId, brief || {})
      return NextResponse.json({ success: true, data: updated })
    }

    if (action === 'confirm-payment') {
      const updated = await confirmPaymentForWorkflow(workflowId, paymentReference)

      if (autoMessage) {
        await applyWorkflowAutomation({
          workflowId: updated.id,
          clientName: workflow.client.name,
          clientPhone: workflow.client.phone,
        })
      }

      return NextResponse.json({ success: true, data: updated })
    }

    if (action === 'transition') {
      if (!toStage || !Object.values(WorkflowStage).includes(toStage)) {
        return NextResponse.json(
          { success: false, error: 'Valid toStage is required for transition action' },
          { status: 400 }
        )
      }

      const updated = await transitionWorkflowStage({
        workflowId,
        toStage,
        actor,
        details,
      })

      if (autoMessage) {
        await applyWorkflowAutomation({
          workflowId: updated.id,
          clientName: workflow.client.name,
          clientPhone: workflow.client.phone,
        })
      }

      return NextResponse.json({ success: true, data: updated })
    }

    return NextResponse.json(
      { success: false, error: 'Unknown workflow action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Workflow action error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to run workflow action' },
      { status: 500 }
    )
  }
}
