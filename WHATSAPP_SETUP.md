# WhatsApp Integration Setup Guide

This guide walks you through setting up WhatsApp Business API integration with your Proactive AI Relationship Manager CRM.

## Overview

The WhatsApp integration allows your CRM to:
- **Send automated follow-up messages** to clients
- **Acknowledge complaints** automatically
- **Confirm resolutions** with clients
- **Receive incoming messages** from clients
- **Track all interactions** in the database
- **Analyze sentiment** of client messages

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your CRM Dashboard                        │
│  (Send WhatsApp messages via UI component)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes                              │
│  • POST /api/whatsapp/send (send messages)                  │
│  • POST /api/whatsapp/webhook (receive messages)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Twilio WhatsApp API                             │
│  (Handles message delivery & receipt)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Client's WhatsApp                               │
│  (Messages delivered to client's phone)                     │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Create Twilio Account

### 1.1 Sign Up for Twilio

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Click "Sign up" and create a free account
3. Verify your email address
4. Complete the account setup

### 1.2 Get Your Credentials

1. Log in to [Twilio Console](https://console.twilio.com)
2. On the dashboard, you'll see:
   - **Account SID**: Your unique account identifier
   - **Auth Token**: Your authentication token (keep this secret!)
3. Copy these values - you'll need them in Step 3

**⚠️ IMPORTANT**: Never commit your Auth Token to git. Always use environment variables.

## Step 2: Set Up WhatsApp Business API

### Option A: Twilio Sandbox (Recommended for Testing)

The Twilio WhatsApp Sandbox is perfect for testing without approval:

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see a sandbox phone number (e.g., `+1 415-523-8886`)
3. To test:
   - Send a WhatsApp message to the sandbox number with text: `join [two-word-code]`
   - You'll receive a confirmation
   - Now you can send/receive messages

**Sandbox Limitations**:
- Only approved test numbers can send messages
- Messages expire after 3 days of inactivity
- Perfect for development and testing

### Option B: Production WhatsApp Business Account

For production use, you need to:

1. Apply for WhatsApp Business API access through Twilio
2. Verify your business information
3. Get a dedicated WhatsApp Business phone number
4. Wait for approval (usually 1-2 business days)

**For now, use the Sandbox** to get started quickly.

## Step 3: Configure Environment Variables

### 3.1 Create `.env.local` File

In the root of your project, create a `.env.local` file:

```bash
# Twilio WhatsApp Configuration
# Get these from Twilio Console (https://console.twilio.com)

# Your Twilio Account SID
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Your Twilio Auth Token (KEEP THIS SECRET!)
TWILIO_AUTH_TOKEN=your_auth_token_here

# Your WhatsApp Business Phone Number
# For Sandbox: +1 415-523-8886 (or your sandbox number)
# For Production: Your verified WhatsApp Business number
TWILIO_WHATSAPP_NUMBER=+1415523XXXX

# Optional: Your personal/test phone number (for testing)
# Format: +[country code][number]
TEST_PHONE_NUMBER=+1234567890
```

### 3.2 Update `.env.example`

Add these to `.env.example` so others know what's needed:

```bash
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+1415523XXXX
TEST_PHONE_NUMBER=+1234567890
```

### 3.3 Verify Environment Variables

Restart your dev server to load the new environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 4: Test the Integration

### 4.1 Test Sending a Message

1. Open your CRM dashboard
2. Go to a client's profile (or create a test client)
3. Click "Send WhatsApp" button
4. Type a test message
5. Click "Send Message"

**Expected Result**: Message appears in the client's WhatsApp inbox

### 4.2 Test Receiving Messages (Sandbox Only)

1. Send a WhatsApp message to your sandbox number
2. Check the CRM dashboard - the message should appear in the Interactions tab
3. Verify sentiment analysis worked (positive/negative/neutral)

### 4.3 Check Logs

Monitor the server logs for debugging:

```bash
# In your terminal where dev server is running
# Look for messages like:
# "Received WhatsApp message: ..."
# "Message sent successfully: ..."
```

## Step 5: Deploy Webhook (Production Only)

For production, you need to set up the webhook so Twilio can send incoming messages to your server.

### 5.1 Deploy Your App

First, deploy your Next.js app to a public URL:

**Option A: Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

**Option B: Other Platforms**
- Heroku
- Railway
- AWS
- Google Cloud
- Azure

### 5.2 Configure Webhook in Twilio

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
3. Find "When a message comes in" webhook
4. Set the URL to: `https://your-domain.com/api/whatsapp/webhook`
5. Click "Save"

**Example**:
```
https://my-crm-app.vercel.app/api/whatsapp/webhook
```

### 5.3 Test Webhook

1. Send a WhatsApp message to your sandbox number
2. Check your app logs - you should see the webhook being called
3. Verify the message appears in your CRM

## Step 6: Add WhatsApp Sender to UI

The WhatsApp sender component is already created. To use it:

### 6.1 Import in Client Detail Page

```typescript
// app/clients/[id]/page.tsx
import { WhatsAppSender } from '@/components/whatsapp-sender'

export default function ClientDetailPage({ params }) {
  const client = await getClient(params.id)
  
  return (
    <div>
      {/* Other client info */}
      
      <WhatsAppSender
        clientId={client.id}
        clientName={client.name}
        clientPhone={client.phone}
        onMessageSent={() => {
          // Refresh interactions or show success message
        }}
      />
    </div>
  )
}
```

### 6.2 Add to Quick Actions

```typescript
// components/quick-actions.tsx
import { WhatsAppSender } from '@/components/whatsapp-sender'

export function QuickActions({ client }) {
  return (
    <div className="space-y-2">
      <WhatsAppSender
        clientId={client.id}
        clientName={client.name}
        clientPhone={client.phone}
      />
      {/* Other quick actions */}
    </div>
  )
}
```

## Step 7: Automate Follow-Ups (Optional)

You can set up automated follow-ups using scheduled jobs:

### 7.1 Using a Cron Job Service

**Option A: Vercel Cron Functions**

```typescript
// app/api/cron/send-followups/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendFollowUpMessage } from '@/lib/whatsapp'

/**
 * Cron job that runs daily to send follow-up messages
 * Triggered by Vercel's cron scheduler
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find follow-ups that are due
    const dueFollowUps = await prisma.followUp.findMany({
      where: {
        dueDate: {
          lte: new Date(),
        },
        completed: false,
      },
      include: {
        client: true,
      },
    })

    // Send WhatsApp message for each due follow-up
    for (const followUp of dueFollowUps) {
      await sendFollowUpMessage(
        followUp.client.phone,
        followUp.client.name,
        followUp.title
      )

      // Mark as completed
      await prisma.followUp.update({
        where: { id: followUp.id },
        data: { completed: true, completedAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      followUpsSent: dueFollowUps.length,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to send follow-ups' },
      { status: 500 }
    )
  }
}
```

**Option B: External Service (Zapier, Make, etc.)**

1. Set up a webhook trigger in Zapier/Make
2. Configure it to call your API endpoint daily
3. The endpoint sends follow-up messages

## Troubleshooting

### Issue: "WhatsApp integration not configured"

**Solution**: Check that all three environment variables are set:
```bash
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_WHATSAPP_NUMBER
```

If any are missing, add them to `.env.local` and restart the dev server.

### Issue: "Invalid phone number format"

**Solution**: Phone numbers must be in E.164 format:
- ✅ Correct: `+1234567890`
- ❌ Wrong: `1234567890` (missing +)
- ❌ Wrong: `+1 (234) 567-8900` (spaces/formatting)

### Issue: "Message failed to send"

**Possible causes**:
1. **Sandbox number not verified**: Send `join [code]` to sandbox number first
2. **Invalid phone number**: Check format is E.164
3. **Rate limiting**: Twilio has rate limits - wait a moment and retry
4. **API credentials wrong**: Verify Account SID and Auth Token in Twilio Console

### Issue: "Webhook not receiving messages"

**Solution**:
1. Verify webhook URL is correct in Twilio Console
2. Check that your app is deployed and accessible
3. Look at server logs for webhook calls
4. Verify webhook signature validation isn't rejecting requests

### Issue: "Messages not appearing in CRM"

**Solution**:
1. Check database connection is working
2. Verify client phone number matches incoming message
3. Check server logs for errors during webhook processing
4. Ensure Prisma migrations have run

## API Reference

### Send Message

**Endpoint**: `POST /api/whatsapp/send`

**Request**:
```json
{
  "clientId": "client-uuid",
  "message": "Your message text here",
  "type": "FOLLOW_UP" // or COMPLAINT_ACK, RESOLUTION, NOTIFICATION
}
```

**Response**:
```json
{
  "success": true,
  "messageSid": "SM1234567890abcdef",
  "interactionId": "interaction-uuid",
  "clientName": "John Doe",
  "clientPhone": "+1234567890"
}
```

### Webhook

**Endpoint**: `POST /api/whatsapp/webhook`

**Incoming Message Format** (from Twilio):
```
MessageSid: SM1234567890abcdef
From: whatsapp:+1234567890
To: whatsapp:+1415523XXXX
Body: Client's message text
```

**Response**: `200 OK` (Twilio expects this to confirm receipt)

## Best Practices

1. **Always validate phone numbers** before sending
2. **Use templates** for common messages (follow-ups, acknowledgments)
3. **Monitor message delivery** - check status in database
4. **Handle errors gracefully** - show user-friendly error messages
5. **Rate limit** - don't send too many messages too quickly
6. **Respect opt-out** - honor client preferences for communication
7. **Keep logs** - maintain audit trail of all messages
8. **Test thoroughly** - use sandbox before going to production

## Security Considerations

1. **Never commit credentials** - use `.env.local` (in `.gitignore`)
2. **Rotate Auth Token** - periodically update in Twilio Console
3. **Validate webhook signatures** - verify requests come from Twilio
4. **Use HTTPS** - always deploy with SSL/TLS
5. **Limit API access** - use API keys with minimal permissions
6. **Monitor usage** - watch for unusual activity in Twilio Console

## Next Steps

1. ✅ Create Twilio account
2. ✅ Set up WhatsApp Sandbox
3. ✅ Configure environment variables
4. ✅ Test sending/receiving messages
5. ✅ Add WhatsApp sender to UI
6. ⏭️ Deploy to production
7. ⏭️ Set up automated follow-ups
8. ⏭️ Monitor and optimize

## Support

For issues or questions:
- **Twilio Docs**: https://www.twilio.com/docs/whatsapp
- **Twilio Support**: https://support.twilio.com
- **GitHub Issues**: Create an issue in your project repo

---

**Last Updated**: April 2026
**Status**: Ready for Testing
