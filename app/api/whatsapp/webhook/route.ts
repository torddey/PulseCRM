/**
 * WhatsApp Webhook Handler
 * 
 * This endpoint receives incoming WhatsApp messages from Twilio
 * and processes them (logs interactions, updates client status, etc.)
 * 
 * Setup:
 * 1. Deploy this endpoint to a public URL
 * 2. In Twilio Console, set Webhook URL to: https://your-domain.com/api/whatsapp/webhook
 * 3. Twilio will POST incoming messages to this endpoint
 * 
 * Security:
 * - Validates Twilio signature to ensure requests are authentic
 * - Only processes valid, verified requests
 * - Logs all incoming messages for audit trail
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeClientMessage } from '@/lib/ai-insights'
import {
  sendWhatsAppMessage,
  validateWebhookSignature,
  parseIncomingMessage,
} from '@/lib/whatsapp'
import {
  applyWorkflowAutomation,
  createStageFollowUpIfMissing,
  getOrCreateClientWorkflow,
  inferNextStageFromMessage,
  logInboundMessage,
  transitionWorkflowStage,
} from '@/lib/workflow-agent'

/**
 * POST /api/whatsapp/webhook
 * 
 * Receives incoming WhatsApp messages from Twilio
 * Validates signature, parses message, and logs interaction
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body as form data
    // Twilio sends webhook data as URL-encoded form data
    const formData = await request.formData()
    const body = Object.fromEntries(formData)

    // Get Twilio signature from headers
    // This is used to verify the request came from Twilio
    const signature = request.headers.get('x-twilio-signature')

    // Get the full URL for signature validation
    // Signature validation requires the exact URL that received the request
    const url = request.url

    // Validate webhook signature
    // This ensures the request actually came from Twilio
    const isValid = validateWebhookSignature(signature || '', url, body)

    if (!isValid) {
      console.warn('Invalid Twilio webhook signature')
      // Return 403 Forbidden for invalid signatures
      // This prevents processing of spoofed requests
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      )
    }

    // Parse the incoming message
    // Extracts phone number, message text, media, etc.
    const incomingMessage = parseIncomingMessage(body)
    const inboundEventId = incomingMessage.messageSid || `${incomingMessage.from}:${incomingMessage.timestamp}`

    console.log('Received WhatsApp message:', {
      from: incomingMessage.from,
      body: incomingMessage.body,
      timestamp: incomingMessage.timestamp,
    })

    // Find the client by phone number
    // This links the incoming message to a client in our database
    const client = await prisma.client.findUnique({
      where: { phone: incomingMessage.from },
    })

    if (!client) {
      console.warn(`Client not found for phone: ${incomingMessage.from}`)
      // Still return 200 OK to acknowledge receipt
      // Twilio will retry if we return error status
      return NextResponse.json(
        { message: 'Client not found, message logged' },
        { status: 200 }
      )
    }

    const duplicateInboundEvent = await prisma.workflowEvent.findUnique({
      where: {
        externalEventId: inboundEventId,
      },
    })

    if (duplicateInboundEvent) {
      return NextResponse.json(
        { success: true, message: 'Duplicate webhook ignored' },
        { status: 200 }
      )
    }

    const workflow = await getOrCreateClientWorkflow(client.id, `${client.name} Service Workflow`)
    await logInboundMessage({
      workflowId: workflow.id,
      body: incomingMessage.body,
      externalEventId: inboundEventId,
    })

    const aiAnalysis = await analyzeClientMessage({
      clientName: client.name,
      message: incomingMessage.body,
      interactionType: 'WHATSAPP',
      fallbackInsightType: 'COMPLAINT_ALERT',
    })
    const sentiment = aiAnalysis?.sentiment || determineSentiment(incomingMessage.body)
    const keyPoints = aiAnalysis?.keyPoints?.length ? aiAnalysis.keyPoints : extractKeyPoints(incomingMessage.body)

    // Log the interaction in database
    // This creates a record of the communication
    const interaction = await prisma.interaction.create({
      data: {
        clientId: client.id,
        type: 'WHATSAPP',
        subject: 'Incoming WhatsApp Message',
        content: incomingMessage.body,
        handledBy: 'WhatsApp Webhook', // Automated, not handled by specific person
        sentiment: sentiment,
        keyPoints,
      },
    })

    // Update client's last interaction date
    // This helps track engagement and identify inactive clients
    await prisma.client.update({
      where: { id: client.id },
      data: {
        lastInteractionDate: new Date(),
        // Update health status based on sentiment
        // Negative sentiment might indicate at-risk client
        healthStatus:
          sentiment === 'NEGATIVE'
            ? 'RED'
            : sentiment === 'POSITIVE'
              ? 'GREEN'
              : 'YELLOW',
      },
    })

    if (aiAnalysis) {
      await prisma.aIInsight.create({
        data: {
          clientId: client.id,
          type: aiAnalysis.insightType,
          title: aiAnalysis.title,
          description: aiAnalysis.description,
          suggestedAction: aiAnalysis.suggestedAction,
          confidence: aiAnalysis.confidence,
        },
      })
    } else if (sentiment === 'NEGATIVE') {
      // Fallback if LLM is unavailable.
      await prisma.aIInsight.create({
        data: {
          clientId: client.id,
          type: 'COMPLAINT_ALERT',
          title: `Negative sentiment detected from ${client.name}`,
          description: `Client sent a message with negative sentiment: "${incomingMessage.body}"`,
          suggestedAction: 'Review the message and reach out to understand the issue',
          confidence: 75,
        },
      })
    }

    const inferredStage = inferNextStageFromMessage(workflow.stage, incomingMessage.body)
    if (inferredStage && inferredStage !== workflow.stage) {
      const updatedWorkflow = await transitionWorkflowStage({
        workflowId: workflow.id,
        toStage: inferredStage,
        actor: 'CLIENT',
        details: `Inferred from inbound WhatsApp message: ${incomingMessage.body.slice(0, 120)}`,
      })

      await applyWorkflowAutomation({
        workflowId: updatedWorkflow.id,
        clientName: client.name,
        clientPhone: client.phone,
      })

      if (updatedWorkflow.stage === 'PRODUCTION') {
        await createStageFollowUpIfMissing({
          clientId: client.id,
          stage: 'PRODUCTION',
          scheduledFor: new Date(Date.now() + 12 * 60 * 60 * 1000),
          title: 'Mid-production update',
          description: 'Send a light-touch progress update and reassure delivery timeline.',
          method: 'WHATSAPP',
        })
      }

      if (updatedWorkflow.stage === 'DELIVERED') {
        await createStageFollowUpIfMissing({
          clientId: client.id,
          stage: 'DELIVERED',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
          title: 'Delivery satisfaction follow-up',
          description: 'Check satisfaction and request quick feedback after delivery.',
          method: 'WHATSAPP',
        })
      }
    }

    // Auto-response flow:
    // For negative sentiment, send an immediate empathetic message and create an urgent follow-up.
    if (sentiment === 'NEGATIVE') {
      const now = new Date()
      const autoReplyCooldownMs = 2 * 60 * 60 * 1000 // 2 hours
      const followUpCooldownMs = 6 * 60 * 60 * 1000 // 6 hours

      const recentAutoReply = await prisma.interaction.findFirst({
        where: {
          clientId: client.id,
          type: 'WHATSAPP',
          handledBy: 'SYSTEM_AUTOMATION',
          subject: 'Automated sentiment acknowledgment',
          createdAt: {
            gte: new Date(now.getTime() - autoReplyCooldownMs),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      if (!recentAutoReply && client.phone) {
        const autoReplyMessage = `Hi ${client.name}, thank you for sharing this. We're sorry for the experience and we've flagged your message for urgent follow-up. A team member will reach out shortly.`
        const sendResult = await sendWhatsAppMessage(client.phone, autoReplyMessage)

        if (sendResult.success) {
          await prisma.interaction.create({
            data: {
              clientId: client.id,
              type: 'WHATSAPP',
              subject: 'Automated sentiment acknowledgment',
              content: autoReplyMessage,
              handledBy: 'SYSTEM_AUTOMATION',
              sentiment: 'NEUTRAL',
              keyPoints: ['Auto-reply sent after negative client sentiment'],
              suggestedAction: 'Human agent to follow up and resolve concern',
            },
          })
        } else {
          console.error('Auto-reply WhatsApp send failed:', sendResult.error)
        }
      }

      const recentUrgentFollowUp = await prisma.followUp.findFirst({
        where: {
          clientId: client.id,
          title: 'Urgent sentiment follow-up',
          createdAt: {
            gte: new Date(now.getTime() - followUpCooldownMs),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      if (!recentUrgentFollowUp) {
        const scheduledFor = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now
        await prisma.followUp.create({
          data: {
            clientId: client.id,
            title: 'Urgent sentiment follow-up',
            description: `Negative sentiment detected from WhatsApp message: "${incomingMessage.body.slice(0, 200)}"`,
            scheduledFor,
            method: 'CALL',
            status: 'PENDING',
            messageTemplate: null,
          },
        })

        if (!client.nextFollowUpDate || scheduledFor < client.nextFollowUpDate) {
          await prisma.client.update({
            where: { id: client.id },
            data: {
              nextFollowUpDate: scheduledFor,
            },
          })
        }
      }
    }

    console.log('Interaction logged successfully:', {
      clientId: client.id,
      interactionId: interaction.id,
      sentiment: sentiment,
    })

    // Return 200 OK to acknowledge receipt
    // Twilio expects a 200 response to confirm webhook was processed
    return NextResponse.json(
      {
        success: true,
        message: 'Message processed',
        interactionId: interaction.id,
      },
      { status: 200 }
    )
  } catch (error) {
    // Log error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook processing error:', errorMessage)

    // Return 500 error
    // Twilio will retry the webhook if we return error status
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * Determine sentiment of a message
 * 
 * Simple keyword-based sentiment analysis
 * In production, use AI/NLP for better accuracy
 * 
 * @param text - Message text to analyze
 * @returns Sentiment: POSITIVE, NEGATIVE, or NEUTRAL
 */
function determineSentiment(
  text: string
): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
  const lowerText = text.toLowerCase()

  // Positive keywords
  const positiveKeywords = [
    'great',
    'excellent',
    'good',
    'happy',
    'satisfied',
    'thanks',
    'thank you',
    'appreciate',
    'love',
    'perfect',
    'awesome',
    'wonderful',
    'amazing',
  ]

  // Negative keywords
  const negativeKeywords = [
    'bad',
    'terrible',
    'awful',
    'hate',
    'angry',
    'frustrated',
    'disappointed',
    'problem',
    'issue',
    'complaint',
    'broken',
    'not working',
    'unhappy',
    'upset',
  ]

  // Count keyword matches
  const positiveCount = positiveKeywords.filter((keyword) =>
    lowerText.includes(keyword)
  ).length

  const negativeCount = negativeKeywords.filter((keyword) =>
    lowerText.includes(keyword)
  ).length

  // Determine sentiment based on keyword counts
  if (negativeCount > positiveCount) {
    return 'NEGATIVE'
  } else if (positiveCount > negativeCount) {
    return 'POSITIVE'
  } else {
    return 'NEUTRAL'
  }
}

/**
 * Extract key points from message
 * 
 * Simple extraction of important information
 * In production, use NLP/AI for better extraction
 * 
 * @param text - Message text
 * @returns Array of key points
 */
function extractKeyPoints(text: string): string[] {
  const keyPoints: string[] = []

  // Extract sentences that might be important
  // Look for sentences with action words or questions
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

  sentences.forEach((sentence) => {
    const trimmed = sentence.trim()

    // Include sentences with action words
    if (
      trimmed.includes('need') ||
      trimmed.includes('want') ||
      trimmed.includes('help') ||
      trimmed.includes('problem') ||
      trimmed.includes('issue') ||
      trimmed.includes('question') ||
      trimmed.includes('?')
    ) {
      keyPoints.push(trimmed)
    }
  })

  // If no key points found, use first sentence
  if (keyPoints.length === 0 && sentences.length > 0) {
    keyPoints.push(sentences[0].trim())
  }

  return keyPoints
}

/**
 * GET /api/whatsapp/webhook
 * 
 * Twilio sends a GET request to verify the webhook URL
 * We need to respond with a 200 OK to confirm the endpoint is valid
 */
export async function GET(request: NextRequest) {
  // Twilio verification: just return 200 OK
  // In production, you might want to validate the signature here too
  return NextResponse.json(
    { message: 'WhatsApp webhook is active' },
    { status: 200 }
  )
}
