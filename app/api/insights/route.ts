/**
 * API Route: GET /api/insights
 * AI Assistant - Your Secret Weapon
 * 
 * Features:
 * - Suggests what to say
 * - When to follow up
 * - Which clients are at risk
 * - Generates actionable insights from client data
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET handler - Fetch AI insights
 * Query params:
 * - type: Filter by insight type (AT_RISK_CLIENT, FOLLOW_UP_REMINDER, etc.)
 * - clientId: Filter by specific client
 * - actedUpon: Filter by whether insight was acted upon (true/false)
 * - limit: Number of insights to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const clientId = searchParams.get('clientId')
    const actedUpon = searchParams.get('actedUpon')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filter conditions
    const where: any = {}
    if (type) where.type = type
    if (clientId) where.clientId = clientId
    if (actedUpon !== null) where.actedUpon = actedUpon === 'true'

    // Fetch insights sorted by confidence (highest first)
    const insights = await prisma.aIInsight.findMany({
      where,
      orderBy: {
        confidence: 'desc',
      },
      take: limit,
    })

    // Get insight statistics
    const stats = {
      total: insights.length,
      byType: await prisma.aIInsight.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      actedUpon: await prisma.aIInsight.count({
        where: { ...where, actedUpon: true },
      }),
    }

    return NextResponse.json({
      success: true,
      data: insights,
      stats,
    })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Mark insight as acted upon
 * Body:
 * - insightId: Insight ID (required)
 * - actedUpon: Whether the insight was acted upon (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { insightId, actedUpon } = body

    if (!insightId || actedUpon === undefined) {
      return NextResponse.json(
        { success: false, error: 'insightId and actedUpon are required' },
        { status: 400 }
      )
    }

    // Update insight
    const insight = await prisma.aIInsight.update({
      where: { id: insightId },
      data: { actedUpon },
    })

    return NextResponse.json({
      success: true,
      data: insight,
    })
  } catch (error: any) {
    console.error('Error updating insight:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Insight not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update insight' },
      { status: 500 }
    )
  }
}
