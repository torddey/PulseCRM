/**
 * WhatsApp Message Status API Route
 * 
 * This endpoint checks the delivery status of previously sent messages
 * Useful for tracking message delivery and handling failures
 * 
 * Endpoint: GET /api/whatsapp/status?messageSid=SM1234567890
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMessageStatus } from '@/lib/whatsapp'

/**
 * GET /api/whatsapp/status
 * 
 * Checks the status of a WhatsApp message
 * 
 * Query Parameters:
 * - messageSid: The message SID returned when message was sent
 * 
 * Example:
 * GET /api/whatsapp/status?messageSid=SM1234567890abcdef
 */
export async function GET(request: NextRequest) {
  try {
    // Get messageSid from query parameters
    const { searchParams } = new URL(request.url)
    const messageSid = searchParams.get('messageSid')

    // Validate messageSid is provided
    if (!messageSid) {
      return NextResponse.json(
        { error: 'Missing required parameter: messageSid' },
        { status: 400 }
      )
    }

    // Get message status from Twilio
    const result = await getMessageStatus(messageSid)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Return status information
    return NextResponse.json(
      {
        success: true,
        messageSid: messageSid,
        status: result.status,
        dateSent: result.dateSent,
        dateUpdated: result.dateUpdated,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      },
      { status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error checking message status:', errorMessage)

    return NextResponse.json(
      { error: 'Failed to check message status' },
      { status: 500 }
    )
  }
}
