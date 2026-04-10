/**
 * API Route: GET/POST /api/followups
 * Manages the Smart Follow-Up Engine
 * 
 * Features:
 * - Automatically reminds staff to check on clients
 * - Sends WhatsApp/SMS follow-ups automatically
 * - Ensures consistent, timely engagement
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET handler - Fetch pending follow-ups
 * Query params:
 * - status: Filter by status (PENDING, SENT, COMPLETED, SKIPPED)
 * - clientId: Filter by specific client
 * - limit: Number of follow-ups to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filter conditions
    const where: any = { status }
    if (clientId) {
      where.clientId = clientId
    }

    // Fetch follow-ups sorted by scheduled date
    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: followUps,
    })
  } catch (error) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch follow-ups' },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Create a new follow-up
 * Body:
 * - clientId: Client ID (required)
 * - title: Follow-up title (required)
 * - description: Follow-up description (optional)
 * - scheduledFor: When to follow up (ISO date string, required)
 * - method: Communication method (EMAIL, SMS, WHATSAPP, CALL, IN_PERSON)
 * - messageTemplate: Template for automated messages (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      title,
      description,
      scheduledFor,
      method = 'EMAIL',
      messageTemplate,
    } = body

    // Validate required fields
    if (!clientId || !title || !scheduledFor) {
      return NextResponse.json(
        { success: false, error: 'clientId, title, and scheduledFor are required' },
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

    // Create follow-up
    const followUp = await prisma.followUp.create({
      data: {
        clientId,
        title,
        description: description || null,
        scheduledFor: new Date(scheduledFor),
        method,
        messageTemplate: messageTemplate || null,
        status: 'PENDING',
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

    // Update client's next follow-up date if this is sooner
    const clientData = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (
      !clientData?.nextFollowUpDate ||
      new Date(scheduledFor) < clientData.nextFollowUpDate
    ) {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          nextFollowUpDate: new Date(scheduledFor),
        },
      })
    }

    return NextResponse.json(
      { success: true, data: followUp },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating follow-up:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create follow-up' },
      { status: 500 }
    )
  }
}
