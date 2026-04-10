/**
 * API Route: GET /api/clients
 * Fetches all clients with their health status and metrics
 * 
 * Features:
 * - Returns all clients sorted by health status
 * - Includes interaction count and pending follow-ups
 * - Filters by health status if provided
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET handler - Fetch all clients
 * Query params:
 * - status: Filter by health status (GREEN, YELLOW, RED)
 * - limit: Number of clients to return (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter conditions
    const where: any = {}
    if (status) {
      where.healthStatus = status
    }

    // Fetch clients with their relationships
    const clients = await prisma.client.findMany({
      where,
      include: {
        interactions: {
          select: { id: true },
        },
        complaints: {
          select: { id: true, status: true },
        },
        followUps: {
          select: { id: true, status: true },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        healthStatus: 'asc',
      },
    })

    // Get total count for pagination
    const total = await prisma.client.count({ where })

    // Transform response to include counts
    const clientsWithCounts = clients.map((client) => ({
      ...client,
      interactionCount: client.interactions.length,
      openComplaints: client.complaints.filter((c) => c.status !== 'RESOLVED').length,
      pendingFollowUps: client.followUps.filter((f) => f.status === 'PENDING').length,
      interactions: undefined,
      complaints: undefined,
      followUps: undefined,
    }))

    return NextResponse.json({
      success: true,
      data: clientsWithCounts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Create a new client
 * Body:
 * - name: Client name (required)
 * - email: Client email (required, unique)
 * - phone: Client phone number (optional)
 * - company: Client company (optional)
 * - notes: Initial notes (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, company, notes } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Create new client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        notes: notes || null,
        healthStatus: 'GREEN', // New clients start as healthy
      },
    })

    // Create initial metrics for the client
    await prisma.clientMetric.create({
      data: {
        clientId: client.id,
        healthScore: 75,
        churnRisk: 0,
      },
    })

    return NextResponse.json(
      { success: true, data: client },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating client:', error)

    // Handle unique constraint violation (duplicate email)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
