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

    // Find all follow-ups that are due
    // A follow-up is due if:
    // 1. dueDate is today or earlier
    // 2. It hasn't been completed yet
    const dueFollowUps = await prisma.followUp.findMany({
      where: {
        dueDate: {
          lte: new Date(), // Due date is today or earlier
        },
        completed: false, // Not yet completed
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

        // Mark follow-up as completed
        // This prevents sending duplicate messages
        await prisma.followUp.update({
          where: { id: followUp.id },
          data: {
            completed: true,
            completedAt: new Date(),
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
