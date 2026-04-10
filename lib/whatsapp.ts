/**
 * WhatsApp Integration Service
 * 
 * This service handles all WhatsApp Business API interactions using Twilio.
 * It provides functions to send messages, handle webhooks, and manage message status.
 * 
 * Setup Requirements:
 * 1. Create a Twilio account at https://www.twilio.com
 * 2. Set up WhatsApp Business API (either Sandbox for testing or Production)
 * 3. Get your Account SID, Auth Token, and WhatsApp Phone Number
 * 4. Add to .env.local:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_WHATSAPP_NUMBER (your WhatsApp Business number)
 */

import twilio from 'twilio'

// Initialize Twilio client with credentials from environment variables
// These should be set in .env.local (never commit to git)
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

// Validate that all required credentials are present
if (!accountSid || !authToken || !whatsappNumber) {
  console.warn(
    'WhatsApp integration not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in .env.local'
  )
}

// Create Twilio client instance
// This is used for all API calls to Twilio
const client = accountSid && authToken ? twilio(accountSid, authToken) : null

/**
 * Send a WhatsApp message to a client
 * 
 * @param toPhoneNumber - Recipient's phone number in E.164 format (e.g., +1234567890)
 * @param messageBody - The message text to send
 * @param mediaUrl - Optional URL of media to attach (image, document, etc.)
 * @returns Message SID (unique identifier) or error object
 * 
 * Example:
 * const result = await sendWhatsAppMessage('+1234567890', 'Hello! How are you?')
 * if (result.success) {
 *   console.log('Message sent:', result.messageSid)
 * } else {
 *   console.error('Failed to send:', result.error)
 * }
 */
export async function sendWhatsAppMessage(
  toPhoneNumber: string,
  messageBody: string,
  mediaUrl?: string
) {
  // Check if Twilio is configured
  if (!client || !whatsappNumber) {
    return {
      success: false,
      error: 'WhatsApp integration not configured. Please set up Twilio credentials in .env.local',
    }
  }

  try {
    // Validate phone number format
    // WhatsApp requires E.164 format: +[country code][number]
    if (!toPhoneNumber.startsWith('+')) {
      return {
        success: false,
        error: 'Phone number must be in E.164 format (e.g., +1234567890)',
      }
    }

    // Build message object
    // mediaUrl is optional - only include if provided
    const messageData: any = {
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${toPhoneNumber}`,
      body: messageBody,
    }

    // Add media if provided
    // Supports images, documents, audio, video
    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl]
    }

    // Send message via Twilio API
    // This is an async operation - Twilio will deliver the message
    const message = await client.messages.create(messageData)

    // Return success with message SID
    // SID can be used to track message status
    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
    }
  } catch (error) {
    // Handle errors gracefully
    // Common errors: invalid phone number, rate limiting, API issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to send WhatsApp message:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send a templated WhatsApp message
 * 
 * Templates are pre-approved messages that can be sent at scale
 * They're more reliable and faster than regular messages
 * 
 * @param toPhoneNumber - Recipient's phone number
 * @param templateName - Name of the approved template
 * @param templateVariables - Variables to fill in the template
 * @returns Message SID or error
 * 
 * Example:
 * const result = await sendWhatsAppTemplate(
 *   '+1234567890',
 *   'follow_up_reminder',
 *   { client_name: 'John', project: 'Website Redesign' }
 * )
 */
export async function sendWhatsAppTemplate(
  toPhoneNumber: string,
  templateName: string,
  templateVariables?: Record<string, string>
) {
  if (!client || !whatsappNumber) {
    return {
      success: false,
      error: 'WhatsApp integration not configured',
    }
  }

  try {
    // Build template message
    // Templates are more efficient for bulk messaging
    const messageData: any = {
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${toPhoneNumber}`,
      contentSid: templateName, // Template identifier
    }

    // Add template variables if provided
    // These replace placeholders in the template
    if (templateVariables) {
      messageData.contentVariables = JSON.stringify(
        Object.values(templateVariables)
      )
    }

    const message = await client.messages.create(messageData)

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to send WhatsApp template:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Validate incoming webhook signature from Twilio
 * 
 * This ensures that webhook requests actually come from Twilio
 * and haven't been tampered with
 * 
 * @param signature - X-Twilio-Signature header from request
 * @param url - Full URL of the webhook endpoint
 * @param params - Request body parameters
 * @returns true if signature is valid, false otherwise
 * 
 * Usage in API route:
 * const isValid = validateWebhookSignature(
 *   req.headers['x-twilio-signature'],
 *   'https://example.com/api/whatsapp/webhook',
 *   req.body
 * )
 * if (!isValid) return res.status(403).send('Invalid signature')
 */
export function validateWebhookSignature(
  signature: string | string[] | undefined,
  url: string,
  params: Record<string, any>
): boolean {
  // Check if signature is provided
  if (!signature || typeof signature !== 'string') {
    return false
  }

  // Check if Twilio is configured
  if (!authToken) {
    console.warn('Cannot validate webhook: TWILIO_AUTH_TOKEN not set')
    return false
  }

  try {
    // Use Twilio's built-in validation
    // This checks the HMAC signature to verify authenticity
    return twilio.validateRequest(authToken, signature, url, params)
  } catch (error) {
    console.error('Webhook validation error:', error)
    return false
  }
}

/**
 * Get message status
 * 
 * Check the delivery status of a previously sent message
 * 
 * @param messageSid - The SID returned when message was sent
 * @returns Message status object
 * 
 * Status values:
 * - queued: Message is queued for delivery
 * - sending: Message is being sent
 * - sent: Message was sent successfully
 * - failed: Message failed to send
 * - delivered: Message was delivered to recipient
 * - undelivered: Message could not be delivered
 * - received: Message was received (for incoming messages)
 */
export async function getMessageStatus(messageSid: string) {
  if (!client) {
    return {
      success: false,
      error: 'WhatsApp integration not configured',
    }
  }

  try {
    // Fetch message details from Twilio
    const message = await client.messages(messageSid).fetch()

    return {
      success: true,
      status: message.status,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to get message status:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Parse incoming WhatsApp message from webhook
 * 
 * Extracts relevant information from Twilio webhook payload
 * 
 * @param body - Request body from Twilio webhook
 * @returns Parsed message object
 * 
 * Returns:
 * {
 *   messageSid: string,
 *   from: string (phone number),
 *   to: string (your WhatsApp number),
 *   body: string (message text),
 *   mediaUrl: string | null,
 *   mediaType: string | null,
 *   timestamp: string
 * }
 */
export function parseIncomingMessage(body: Record<string, any>) {
  return {
    messageSid: body.MessageSid,
    from: body.From?.replace('whatsapp:', '') || '',
    to: body.To?.replace('whatsapp:', '') || '',
    body: body.Body || '',
    mediaUrl: body.MediaUrl0 || null,
    mediaType: body.MediaContentType0 || null,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Send a follow-up message with template variables
 * 
 * Convenience function for sending follow-up messages to clients
 * Automatically formats the message with client information
 * 
 * @param clientPhone - Client's phone number
 * @param clientName - Client's name
 * @param followUpTitle - Title/subject of follow-up
 * @param customMessage - Optional custom message (if not using template)
 * @returns Message result
 */
export async function sendFollowUpMessage(
  clientPhone: string,
  clientName: string,
  followUpTitle: string,
  customMessage?: string
) {
  // Use custom message if provided, otherwise create default
  const message = customMessage
    ? customMessage
    : `Hi ${clientName}, just checking in on "${followUpTitle}". How are things progressing? Let me know if you need anything!`

  return sendWhatsAppMessage(clientPhone, message)
}

/**
 * Send a complaint acknowledgment message
 * 
 * Automatically sends a message to acknowledge a complaint
 * and let the client know it's being handled
 * 
 * @param clientPhone - Client's phone number
 * @param clientName - Client's name
 * @param complaintTitle - Title of the complaint
 * @returns Message result
 */
export async function sendComplaintAcknowledgment(
  clientPhone: string,
  clientName: string,
  complaintTitle: string
) {
  const message = `Hi ${clientName}, thank you for reporting "${complaintTitle}". We've received your complaint and our team is looking into it. We'll get back to you shortly with an update.`

  return sendWhatsAppMessage(clientPhone, message)
}

/**
 * Send a resolution message
 * 
 * Sends a message to confirm that a complaint has been resolved
 * 
 * @param clientPhone - Client's phone number
 * @param clientName - Client's name
 * @param complaintTitle - Title of the complaint
 * @param resolutionNotes - Details about how it was resolved
 * @returns Message result
 */
export async function sendResolutionMessage(
  clientPhone: string,
  clientName: string,
  complaintTitle: string,
  resolutionNotes: string
) {
  const message = `Hi ${clientName}, we're happy to let you know that "${complaintTitle}" has been resolved. ${resolutionNotes} Thank you for your patience!`

  return sendWhatsAppMessage(clientPhone, message)
}

export default {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  validateWebhookSignature,
  getMessageStatus,
  parseIncomingMessage,
  sendFollowUpMessage,
  sendComplaintAcknowledgment,
  sendResolutionMessage,
}
