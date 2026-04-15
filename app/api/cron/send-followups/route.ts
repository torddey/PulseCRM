/**
 * Automated Follow-Up Cron Job
 * 
 * This endpoint runs on a schedule (via Vercel Cron or external service)
 * to automatically send WhatsApp follow-up messages to clients
 * 
 * Setup:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/send-followups",
 *        "schedule": "0 9 * * *"  // Daily at 9 AM
 *      }]
 *    }
 * 
 * 2. Set CRON_SECRET in environment variables
 * 
 * 3. Twilio will send messages to clients with due follow-ups
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendFollowUpMessage } from '@/lib/whatsapp'
import { applyWorkflowAutomation, transitionWorkflowStage } from '@/lib/workflow-agent'

/**
 * GET /api/cron/send-followups
 * 
 * Sends automated follow-up messages to clients with due follow-ups
 * Triggered by Vercel Cron or external cron service
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    // This prevents unauthorized access to the cron endpoint
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting automated follow-up job...')

    // Find all follow-ups that are due.
    // A follow-up is due if:
    // 1. scheduledFor is now or earlier
    // 2. status is still PENDING
    // 3. method is WHATSAPP (only WhatsApp auto-send here)
    const dueFollowUps = await prisma.followUp.findMany({
      where: {
        scheduledFor: {
          lte: new Date(),
        },
        status: 'PENDING',
        method: 'WHATSAPP',
      },
      include: {
        client: true, // Include client info for messaging
      },
    })

    console.log(`Found ${dueFollowUps.length} due follow-ups`)

    // Track results
    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    // Send WhatsApp message for each due follow-up
    for (const followUp of dueFollowUps) {
      try {
        // Validate client has phone number
        if (!followUp.client.phone) {
          console.warn(
            `Client ${followUp.client.id} has no phone number, skipping`
          )
          failureCount++
          errors.push(
            `Client ${followUp.client.name} has no phone number`
          )
          continue
        }

        // Send follow-up message via WhatsApp
        // Message includes client name and follow-up title
        const result = await sendFollowUpMessage(
          followUp.client.phone,
          followUp.client.name,
          followUp.title
        )

        if (!result.success) {
          console.error(
            `Failed to send follow-up to ${followUp.client.name}:`,
            result.error
          )
          failureCount++
          errors.push(
            `Failed to send to ${followUp.client.name}: ${result.error}`
          )
          continue
        }

        // Mark follow-up as sent to prevent duplicate automated messages.
        await prisma.followUp.update({
          where: { id: followUp.id },
          data: {
            status: 'SENT',
            completedAt: new Date(),
            completedBy: 'SYSTEM_AUTOMATION',
            reminderSentAt: new Date(),
          },
        })

        console.log(
          `Successfully sent follow-up to ${followUp.client.name}`
        )
        successCount++
      } catch (error) {
        // Handle individual follow-up errors
        // Continue processing other follow-ups even if one fails
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error'
        console.error(
          `Error processing follow-up ${followUp.id}:`,
          errorMsg
        )
        failureCount++
        errors.push(`Follow-up ${followUp.id}: ${errorMsg}`)
      }
    }

    // Workflow automation layer:
    // 1) Mid-production check-ins
    // 2) Pre-delivery confirmations
    // 3) Retention nudges after delivery
    const activeWorkflows = await prisma.clientWorkflow.findMany({
      where: {
        stage: {
          in: ['PRODUCTION', 'READY_TO_DELIVER', 'DELIVERED'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    for (const workflow of activeWorkflows) {
      const now = new Date()

      if (workflow.stage === 'PRODUCTION') {
        const shouldSendMidProduction =
          workflow.productionStartedAt &&
          !workflow.midProductionUpdateAt &&
          now.getTime() - workflow.productionStartedAt.getTime() >= 12 * 60 * 60 * 1000

        if (shouldSendMidProduction && workflow.client.phone) {
          const message = `Hi ${workflow.client.name}, quick update: production is progressing well. We will share final prep and delivery ETA shortly.`
          const sendResult = await sendFollowUpMessage(
            workflow.client.phone,
            workflow.client.name,
            'Mid-production update',
            message
          )

          if (sendResult.success) {
            await prisma.clientWorkflow.update({
              where: { id: workflow.id },
              data: {
                midProductionUpdateAt: now,
                productionProgress: 60,
              },
            })
          }
        }
      }

      if (workflow.stage === 'READY_TO_DELIVER') {
        const shouldNotify =
          !workflow.preDeliveryConfirmedAt &&
          workflow.readyToDeliverAt &&
          now.getTime() - workflow.readyToDeliverAt.getTime() >= 1 * 60 * 60 * 1000

        if (shouldNotify && workflow.client.phone) {
          await applyWorkflowAutomation({
            workflowId: workflow.id,
            clientName: workflow.client.name,
            clientPhone: workflow.client.phone,
          })
          await prisma.clientWorkflow.update({
            where: { id: workflow.id },
            data: {
              preDeliveryConfirmedAt: now,
            },
          })
        }
      }

      if (workflow.stage === 'DELIVERED' && workflow.deliveredAt) {
        const shouldSendRetention =
          !workflow.followUpSentAt &&
          now.getTime() - workflow.deliveredAt.getTime() >= 24 * 60 * 60 * 1000

        if (shouldSendRetention) {
          await transitionWorkflowStage({
            workflowId: workflow.id,
            toStage: 'FOLLOWUP_SENT',
            actor: 'SYSTEM',
            details: 'Automated retention follow-up triggered 24h after delivery.',
            eventType: 'FOLLOWUP_TRIGGERED',
          })

          await applyWorkflowAutomation({
            workflowId: workflow.id,
            clientName: workflow.client.name,
            clientPhone: workflow.client.phone,
          })
        }
      }
    }

    // Complaint auto-escalation if unresolved for >24h after creation.
    const staleComplaints = await prisma.complaint.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        createdAt: {
          lte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    })

    for (const complaint of staleComplaints) {
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: {
          status: 'URGENT',
          priority: complaint.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          reminderCount: complaint.reminderCount + 1,
          lastReminderSent: new Date(),
        },
      })

      await prisma.aIInsight.create({
        data: {
          clientId: complaint.clientId,
          type: 'COMPLAINT_ALERT',
          title: `Escalated complaint: ${complaint.title}`,
          description: `Complaint remains unresolved after 24h for ${complaint.client.name}.`,
          suggestedAction: 'Manual review required before sending any refund/apology language.',
          confidence: 92,
        },
      })
    }

    console.log(
      `Cron job completed: ${successCount} sent, ${failureCount} failed`
    )

    // Return results
    return NextResponse.json(
      {
        success: true,
        message: 'Automated follow-up job completed',
        followUpsSent: successCount,
        followUpsFailed: failureCount,
        totalProcessed: dueFollowUps.length,
        workflowAutomationsProcessed: activeWorkflows.length,
        escalatedComplaints: staleComplaints.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Cron job error:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process follow-ups',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/send-followups
 * 
 * Alternative endpoint for services that use POST instead of GET
 * (e.g., Make, Zapier, etc.)
 */
export async function POST(request: NextRequest) {
  // Delegate to GET handler
  return GET(request)
}
