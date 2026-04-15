/**
 * API Route: GET/POST /api/interactions
 * Interaction Memory - Complete communication history
 * 
 * Features:
 * - Stores calls, messages, emails, meetings
 * - Sentiment analysis (AI determines if positive, neutral, or negative)
 * - Key takeaways and suggested actions
 * - Never more "Wait... what did this client say again?"
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeClientMessage } from '@/lib/ai-insights'
import {
  applyWorkflowAutomation,
  getOrCreateClientWorkflow,
  inferNextStageFromMessage,
  transitionWorkflowStage,
} from '@/lib/workflow-agent'

/**
 * GET handler - Fetch interactions
 * Query params:
 * - clientId: Filter by specific client (optional)
 * - type: Filter by type (CALL, EMAIL, SMS, WHATSAPP, MEETING, NOTE, FEEDBACK)
 * - sentiment: Filter by sentiment (POSITIVE, NEUTRAL, NEGATIVE)
 * - limit: Number of interactions to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const type = searchParams.get('type')
    const sentiment = searchParams.get('sentiment')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filter conditions
    const where: any = {}
    if (clientId) where.clientId = clientId
    if (type) where.type = type
    if (sentiment) where.sentiment = sentiment

    // Fetch interactions sorted by creation date (newest first)
    const interactions = await prisma.interaction.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // Get sentiment breakdown based on active filters
    const sentimentBreakdown = await prisma.interaction.groupBy({
      by: ['sentiment'],
      where,
      _count: true,
    })

    return NextResponse.json({
      success: true,
      data: interactions,
      stats: {
        total: interactions.length,
        sentimentBreakdown: sentimentBreakdown.reduce(
          (acc, item) => ({
            ...acc,
            [item.sentiment]: item._count,
          }),
          {}
        ),
      },
    })
  } catch (error) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Log a new interaction
 * Body:
 * - clientId: Client ID (required)
 * - type: Type of interaction (CALL, EMAIL, SMS, WHATSAPP, MEETING, NOTE, FEEDBACK)
 * - subject: Subject/title (optional)
 * - content: Interaction content/notes (required)
 * - handledBy: Staff member who handled it (required)
 * - sentiment: Sentiment (POSITIVE, NEUTRAL, NEGATIVE) - optional, can be auto-detected
 * - keyPoints: Array of key points from interaction (optional)
 * - suggestedAction: Suggested next action (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      type,
      subject,
      content,
      handledBy,
      sentiment = 'NEUTRAL',
      keyPoints = [],
      suggestedAction,
    } = body

    // Validate required fields
    if (!clientId || !type || !content || !handledBy) {
      return NextResponse.json(
        { success: false, error: 'clientId, type, content, and handledBy are required' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    const aiAnalysis = await analyzeClientMessage({
      clientName: client.name,
      message: content,
      interactionType: type,
      fallbackInsightType: 'AT_RISK_CLIENT',
    })

    const finalSentiment = aiAnalysis?.sentiment || sentiment
    const finalKeyPoints = aiAnalysis?.keyPoints?.length ? aiAnalysis.keyPoints : keyPoints
    const finalSuggestedAction = aiAnalysis?.suggestedAction || suggestedAction

    // Create interaction
    const interaction = await prisma.interaction.create({
      data: {
        clientId,
        type,
        subject: subject || null,
        content,
        handledBy,
        sentiment: finalSentiment,
        keyPoints: finalKeyPoints,
        suggestedAction: finalSuggestedAction || null,
      },
    })

    // Update client's last interaction date
    await prisma.client.update({
      where: { id: clientId },
      data: {
        lastInteractionDate: new Date(),
        // If interaction is positive, improve health status
        healthStatus:
          finalSentiment === 'POSITIVE'
            ? 'GREEN'
            : finalSentiment === 'NEGATIVE'
              ? 'RED'
              : client.healthStatus,
      },
    })

    // Update client metrics
    const metrics = await prisma.clientMetric.findUnique({
      where: { clientId },
    })

    if (metrics) {
      await prisma.clientMetric.update({
        where: { clientId },
        data: {
          totalInteractions: metrics.totalInteractions + 1,
          lastInteractionDays: 0,
        },
      })
    }

    // Create AI insight from LLM output when available.
    // Fallback to rule-based insight for negative sentiment.
    if (aiAnalysis) {
      await prisma.aIInsight.create({
        data: {
          clientId,
          type: aiAnalysis.insightType,
          title: aiAnalysis.title,
          description: aiAnalysis.description,
          suggestedAction: aiAnalysis.suggestedAction,
          confidence: aiAnalysis.confidence,
        },
      })
    } else if (finalSentiment === 'NEGATIVE') {
      await prisma.aIInsight.create({
        data: {
          clientId,
          type: 'AT_RISK_CLIENT',
          title: `Negative feedback from ${client.name}`,
          description: `Recent ${type.toLowerCase()} interaction had negative sentiment. Content: ${content.substring(0, 100)}...`,
          suggestedAction: `Follow up with ${client.name} to address concerns and improve relationship`,
          confidence: 80,
        },
      })
    }

    if (type === 'WHATSAPP') {
      const workflow = await getOrCreateClientWorkflow(clientId, `${client.name} Service Workflow`)
      const inferredStage = inferNextStageFromMessage(workflow.stage, content)
      if (inferredStage && inferredStage !== workflow.stage) {
        const updatedWorkflow = await transitionWorkflowStage({
          workflowId: workflow.id,
          toStage: inferredStage,
          actor: 'HUMAN',
          details: 'Stage inferred from manually logged WhatsApp interaction.',
        })

        await applyWorkflowAutomation({
          workflowId: updatedWorkflow.id,
          clientName: client.name,
          clientPhone: client.phone,
        })
      }
    }

    return NextResponse.json(
      { success: true, data: interaction },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating interaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create interaction' },
      { status: 500 }
    )
  }
}
