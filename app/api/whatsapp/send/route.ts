/**
 * Send WhatsApp Message API Route
 * 
 * This endpoint allows the CRM to send WhatsApp messages to clients
 * Used for follow-ups, complaint acknowledgments, and notifications
 * 
 * Endpoint: POST /api/whatsapp/send
 * 
 * Request body:
 * {
 *   clientId: string,
 *   message: string,
 *   type: 'FOLLOW_UP' | 'COMPLAINT_ACK' | 'RESOLUTION' | 'NOTIFICATION'
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

/**
 * POST /api/whatsapp/send
 * 
 * Sends a WhatsApp message to a client
 * Logs the message in the database for tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { clientId, message, type = 'NOTIFICATION' } = body

    // Validate required fields
    if (!clientId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, message' },
        { status: 400 }
      )
    }

    // Find the client in database
    // Verify client exists and get their phone number
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    if (!client.phone) {
      return NextResponse.json(
        { error: 'Client does not have a phone number' },
        { status: 400 }
      )
    }

    // Send the WhatsApp message via Twilio
    // This is the actual message delivery
    const result = await sendWhatsAppMessage(client.phone, message)

    if (!result.success) {
      console.error('Failed to send WhatsApp message:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Log the outgoing message in database
    // This creates a record for audit trail and history
    const interaction = await prisma.interaction.create({
      data: {
        clientId: client.id,
        type: 'WHATSAPP',
        subject: `WhatsApp ${type}`,
        content: message,
        handledBy: 'System', // Automated message
        sentiment: 'NEUTRAL',
        keyPoints: [message.substring(0, 100)], // First 100 chars as key point
      },
    })

    // Update client's last interaction date
    // This helps track engagement
    await prisma.client.update({
      where: { id: client.id },
      data: {
        lastInteractionDate: new Date(),
      },
    })

    console.log('WhatsApp message sent successfully:', {
      clientId: client.id,
      clientPhone: client.phone,
      messageSid: result.messageSid,
      interactionId: interaction.id,
    })

    // Return success response with message details
    return NextResponse.json(
      {
        success: true,
        message: 'WhatsApp message sent successfully',
        messageSid: result.messageSid,
        interactionId: interaction.id,
        clientName: client.name,
        clientPhone: client.phone,
      },
      { status: 200 }
    )
  } catch (error) {
    // Log error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error sending WhatsApp message:', errorMessage)

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/whatsapp/send
 * 
 * Health check endpoint
 * Verifies the API route is working
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'WhatsApp send API is active' },
    { status: 200 }
  )
}
