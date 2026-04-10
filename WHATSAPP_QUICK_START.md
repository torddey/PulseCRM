# WhatsApp Integration - Quick Start Guide

**TL;DR**: Get WhatsApp messaging working in 10 minutes.

## 1. Create Twilio Account (2 minutes)

1. Go to https://www.twilio.com/try-twilio
2. Sign up and verify email
3. Go to https://console.twilio.com
4. Copy your **Account SID** and **Auth Token**

## 2. Get WhatsApp Sandbox (1 minute)

1. In Twilio Console: **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Copy the sandbox number (e.g., `+1 415-523-8886`)
3. Send WhatsApp message to sandbox with: `join [two-word-code]`
4. Wait for confirmation

## 3. Configure Environment (2 minutes)

Create `.env.local` in project root:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+1415523XXXX
```

Restart dev server: `npm run dev`

## 4. Test Sending Message (3 minutes)

1. Open CRM at http://localhost:3000
2. Click "Add New Client"
3. Enter name and phone (E.164 format: `+1234567890`)
4. Save client
5. Click "Send WhatsApp" button
6. Type test message and send
7. Check your WhatsApp - message should arrive!

## 5. Test Receiving Message (2 minutes)

1. Send WhatsApp message to sandbox number
2. Check CRM - message should appear in Interactions
3. Verify sentiment was detected

## Done! ✅

You now have WhatsApp messaging working. Next steps:

- **For Production**: Deploy app and configure webhook in Twilio Console
- **For Automation**: Set up cron job for automated follow-ups
- **For Enhancement**: Integrate with email service for notifications

---

## File Structure

All WhatsApp code is in these files:

```
lib/whatsapp.ts                          # Core service
app/api/whatsapp/send/route.ts          # Send messages
app/api/whatsapp/webhook/route.ts       # Receive messages
app/api/whatsapp/status/route.ts        # Check status
app/api/cron/send-followups/route.ts    # Automated follow-ups
components/whatsapp-sender.tsx          # UI component
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Integration not configured" | Check `.env.local` has all 3 variables |
| "Invalid phone number" | Use E.164 format: `+1234567890` |
| "Message failed to send" | Verify sandbox number with `join [code]` first |
| "Webhook not receiving" | Deploy app and configure webhook URL in Twilio |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/whatsapp/send` | POST | Send message to client |
| `/api/whatsapp/webhook` | POST | Receive incoming messages |
| `/api/whatsapp/status` | GET | Check message delivery status |
| `/api/cron/send-followups` | GET/POST | Send automated follow-ups |

## Next: Production Setup

When ready to go live:

1. **Deploy app** to Vercel or similar
2. **Configure webhook** in Twilio Console:
   - URL: `https://your-domain.com/api/whatsapp/webhook`
3. **Set up cron job** for automated follow-ups (optional)
4. **Monitor** message delivery and errors

## Documentation

- **WHATSAPP_SETUP.md** - Detailed setup instructions
- **WHATSAPP_INTEGRATION_GUIDE.md** - Complete reference guide
- **WHATSAPP_FILES_SUMMARY.md** - Overview of all files

## Support

- Twilio Docs: https://www.twilio.com/docs/whatsapp
- Twilio Support: https://support.twilio.com

---

**Status**: Ready to use
**Last Updated**: April 2026
