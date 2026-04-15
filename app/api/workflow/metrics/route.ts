import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeWorkflowMetrics } from '@/lib/workflow-agent'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.max(1, parseInt(searchParams.get('days') || '30', 10))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const workflows = await prisma.clientWorkflow.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
      select: {
        inquiryAt: true,
        paidAt: true,
        conceptsSentAt: true,
        conceptApprovedAt: true,
        readyToDeliverAt: true,
        deliveredAt: true,
        followUpSentAt: true,
        createdAt: true,
      },
    })

    const complaintsAfterDelivery = await prisma.complaint.count({
      where: {
        createdAt: {
          gte: since,
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'URGENT'],
        },
      },
    })

    const metrics = computeWorkflowMetrics({
      workflows,
      complaintsAfterDelivery,
    })

    return NextResponse.json({
      success: true,
      data: {
        periodDays: days,
        workflowCount: workflows.length,
        ...metrics,
      },
    })
  } catch (error) {
    console.error('Error computing workflow metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to compute workflow metrics' },
      { status: 500 }
    )
  }
}
