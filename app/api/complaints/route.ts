/**
 * API Route: GET/POST /api/complaints
 * Complaint Tracker - Zero Chaos
 * 
 * Features:
 * - Logs every issue
 * - Assigns status: Pending / Resolved / Urgent
 * - Sends reminders until resolved
 * - Ensures nothing falls through the cracks
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET handler - Fetch complaints
 * Query params:
 * - status: Filter by status (PENDING, IN_PROGRESS, RESOLVED, URGENT)
 * - priority: Filter by priority (LOW, MEDIUM, HIGH, CRITICAL)
 * - clientId: Filter by specific client
 * - limit: Number of complaints to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filter conditions
    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (clientId) where.clientId = clientId

    // Fetch complaints sorted by priority and creation date
    const complaints = await prisma.complaint.findMany({
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
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    // Get count of open complaints
    const openCount = await prisma.complaint.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS', 'URGENT'] },
      },
    })

    return NextResponse.json({
      success: true,
      data: complaints,
      stats: {
        openComplaints: openCount,
      },
    })
  } catch (error) {
    console.error('Error fetching complaints:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch complaints' },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Create a new complaint
 * Body:
 * - clientId: Client ID (required)
 * - title: Complaint title (required)
 * - description: Complaint description (required)
 * - category: Category (PRODUCT_QUALITY, SERVICE_DELIVERY, BILLING, SUPPORT, DELIVERY, OTHER)
 * - priority: Priority level (LOW, MEDIUM, HIGH, CRITICAL)
 * - assignedTo: Staff member to handle (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      title,
      description,
      category = 'OTHER',
      priority = 'MEDIUM',
      assignedTo,
    } = body

    // Validate required fields
    if (!clientId || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'clientId, title, and description are required' },
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

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        clientId,
        title,
        description,
        category,
        priority,
        assignedTo: assignedTo || null,
        status: priority === 'CRITICAL' ? 'URGENT' : 'PENDING',
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Update client health status based on complaint priority
    if (priority === 'CRITICAL' || priority === 'HIGH') {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          healthStatus: 'RED',
        },
      })
    }

    // Create AI insight for urgent complaints
    if (priority === 'CRITICAL') {
      await prisma.aIInsight.create({
        data: {
          clientId,
          type: 'COMPLAINT_ALERT',
          title: `URGENT: ${title}`,
          description: `Critical complaint from ${client.name}: ${description}`,
          suggestedAction: `Immediately contact ${client.name} to resolve this critical issue`,
          confidence: 95,
        },
      })
    }

    return NextResponse.json(
      { success: true, data: complaint },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating complaint:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create complaint' },
      { status: 500 }
    )
  }
}
