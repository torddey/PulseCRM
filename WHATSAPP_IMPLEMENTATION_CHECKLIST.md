# WhatsApp Integration - Implementation Checklist

Use this checklist to track your WhatsApp integration implementation progress.

## Phase 1: Setup & Configuration

### Twilio Account Setup
- [ ] Create Twilio account at https://www.twilio.com/try-twilio
- [ ] Verify email address
- [ ] Log in to Twilio Console
- [ ] Copy Account SID
- [ ] Copy Auth Token (keep secret!)
- [ ] Note: Free trial includes $15 credit

### WhatsApp Sandbox Setup
- [ ] Navigate to Messaging → Try it out → Send a WhatsApp message
- [ ] Copy sandbox phone number (e.g., +1 415-523-8886)
- [ ] Send WhatsApp message to sandbox with: `join [two-word-code]`
- [ ] Receive confirmation message
- [ ] Sandbox is now active and ready for testing

### Environment Configuration
- [ ] Create `.env.local` file in project root
- [ ] Add `TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- [ ] Add `TWILIO_AUTH_TOKEN=your_auth_token_here`
- [ ] Add `TWILIO_WHATSAPP_NUMBER=+1415523XXXX`
- [ ] Verify `.env.local` is in `.gitignore` (don't commit!)
- [ ] Restart dev server: `npm run dev`
- [ ] Verify environment variables are loaded

### Verify Installation
- [ ] Twilio SDK is installed: `npm list twilio`
- [ ] All WhatsApp files exist:
  - [ ] `lib/whatsapp.ts`
  - [ ] `app/api/whatsapp/send/route.ts`
  - [ ] `app/api/whatsapp/webhook/route.ts`
  - [ ] `app/api/whatsapp/status/route.ts`
  - [ ] `app/api/cron/send-followups/route.ts`
  - [ ] `components/whatsapp-sender.tsx`
- [ ] Dev server is running without errors

## Phase 2: Testing - Send Messages

### Create Test Client
- [ ] Open CRM at http://localhost:3000
- [ ] Click "Add New Client"
- [ ] Enter test client name
- [ ] Enter phone number in E.164 format (e.g., +1234567890)
- [ ] Save client
- [ ] Verify client appears in dashboard

### Send Test Message
- [ ] Click "Send WhatsApp" button on client
- [ ] Type test message: "Hello, this is a test message"
- [ ] Click "Send Message"
- [ ] Verify success message appears
- [ ] Check your WhatsApp - message should arrive within 10 seconds
- [ ] Verify message content is correct

### Test Message Templates
- [ ] Click "Send WhatsApp" again
- [ ] Select "Follow-Up" template
- [ ] Verify message is pre-filled with template
- [ ] Modify message if desired
- [ ] Send and verify it arrives
- [ ] Repeat for "Complaint Acknowledgment" template
- [ ] Repeat for "Resolution Confirmation" template

### Verify Database Logging
- [ ] Open database client (Prisma Studio or direct query)
- [ ] Check `Interaction` table
- [ ] Verify sent messages are logged with:
  - [ ] Correct client ID
  - [ ] Message type: "WHATSAPP"
  - [ ] Message content
  - [ ] Timestamp

## Phase 3: Testing - Receive Messages

### Send Incoming Message
- [ ] Send WhatsApp message to sandbox number
- [ ] Message content: "This is a test incoming message"
- [ ] Wait 5-10 seconds for webhook processing

### Verify Message Reception
- [ ] Open CRM dashboard
- [ ] Go to Interactions tab
- [ ] Verify incoming message appears with:
  - [ ] Correct sender phone number
  - [ ] Message content
  - [ ] Timestamp
  - [ ] Type: "WHATSAPP"

### Verify Sentiment Detection
- [ ] Send message with positive sentiment: "Great job! I love this!"
- [ ] Verify sentiment is detected as "POSITIVE"
- [ ] Send message with negative sentiment: "This is terrible and broken"
- [ ] Verify sentiment is detected as "NEGATIVE"
- [ ] Send neutral message: "What time is the meeting?"
- [ ] Verify sentiment is detected as "NEUTRAL"

### Verify Client Status Update
- [ ] Send negative sentiment message
- [ ] Check client health status
- [ ] Verify it changed to "AT_RISK"
- [ ] Send positive sentiment message
- [ ] Verify health status changed to "HEALTHY"

### Verify AI Insights
- [ ] Send negative sentiment message
- [ ] Check AI Insights section
- [ ] Verify "COMPLAINT_ALERT" insight was created
- [ ] Verify insight includes:
  - [ ] Title with client name
  - [ ] Description of the complaint
  - [ ] Suggested action
  - [ ] Confidence score

## Phase 4: UI Integration

### Add WhatsAppSender Component
- [ ] Import WhatsAppSender in client detail page
- [ ] Add component with required props:
  - [ ] `clientId`
  - [ ] `clientName`
  - [ ] `clientPhone`
- [ ] Verify component renders correctly
- [ ] Test sending message from component
- [ ] Verify success/error messages display

### Test Component Features
- [ ] Click "Send WhatsApp" button
- [ ] Verify dialog opens
- [ ] Verify template buttons are visible
- [ ] Click each template and verify message is filled
- [ ] Type custom message
- [ ] Verify character count updates
- [ ] Click "Send Message"
- [ ] Verify loading state shows
- [ ] Verify success message appears
- [ ] Verify dialog closes after 1.5 seconds

### Test Error Handling
- [ ] Try sending without message text
- [ ] Verify error message: "Please enter a message"
- [ ] Try sending to client without phone number
- [ ] Verify error message: "Client does not have a phone number"
- [ ] Verify error toast notification appears

## Phase 5: API Testing

### Test Send Endpoint
- [ ] Open terminal or API client (Postman, curl, etc.)
- [ ] Make POST request to `/api/whatsapp/send`
- [ ] Request body:
  ```json
  {
    "clientId": "your-client-uuid",
    "message": "Test message",
    "type": "FOLLOW_UP"
  }
  ```
- [ ] Verify response includes:
  - [ ] `success: true`
  - [ ] `messageSid`
  - [ ] `interactionId`
  - [ ] `clientName`
  - [ ] `clientPhone`

### Test Status Endpoint
- [ ] Get a message SID from previous send
- [ ] Make GET request to `/api/whatsapp/status?messageSid=SM1234567890`
- [ ] Verify response includes:
  - [ ] `status` (sent, delivered, failed, etc.)
  - [ ] `dateSent`
  - [ ] `dateUpdated`

### Test Webhook Endpoint
- [ ] Make GET request to `/api/whatsapp/webhook`
- [ ] Verify response: `200 OK`
- [ ] Verify message: "WhatsApp webhook is active"

## Phase 6: Production Preparation

### Code Review
- [ ] Review all WhatsApp code for quality
- [ ] Verify error handling is comprehensive
- [ ] Check for security vulnerabilities
- [ ] Verify no API keys in code (all in env vars)
- [ ] Check code comments are clear
- [ ] Verify TypeScript types are correct

### Documentation
- [ ] Read WHATSAPP_SETUP.md
- [ ] Read WHATSAPP_INTEGRATION_GUIDE.md
- [ ] Read WHATSAPP_FILES_SUMMARY.md
- [ ] Understand all API endpoints
- [ ] Understand webhook flow
- [ ] Understand cron job setup

### Environment Variables
- [ ] Create `.env.example` with placeholders
- [ ] Document all required variables
- [ ] Document optional variables
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Test that app works with env vars

### Database
- [ ] Verify Prisma migrations are up to date
- [ ] Verify `Interaction` table exists
- [ ] Verify `Client` table has `phone` field
- [ ] Verify `FollowUp` table exists (for cron job)
- [ ] Verify `AIInsight` table exists
- [ ] Test database queries work correctly

## Phase 7: Deployment (Optional)

### Deploy Application
- [ ] Choose hosting platform (Vercel recommended)
- [ ] Deploy application
- [ ] Verify app is accessible at public URL
- [ ] Test sending message from production
- [ ] Verify message arrives

### Configure Webhook
- [ ] Get public URL of deployed app
- [ ] Go to Twilio Console
- [ ] Navigate to Messaging → Settings → WhatsApp Sandbox Settings
- [ ] Find "When a message comes in" webhook
- [ ] Set URL to: `https://your-domain.com/api/whatsapp/webhook`
- [ ] Click "Save"
- [ ] Send test message to sandbox
- [ ] Verify message appears in CRM

### Set Environment Variables
- [ ] In hosting platform (Vercel, etc.)
- [ ] Add `TWILIO_ACCOUNT_SID`
- [ ] Add `TWILIO_AUTH_TOKEN`
- [ ] Add `TWILIO_WHATSAPP_NUMBER`
- [ ] Add `CRON_SECRET` (for automated follow-ups)
- [ ] Redeploy application

### Test Production
- [ ] Send message from production CRM
- [ ] Verify message arrives
- [ ] Send message to sandbox
- [ ] Verify webhook receives it
- [ ] Verify message appears in CRM

## Phase 8: Automated Follow-Ups (Optional)

### Create Follow-Up Records
- [ ] Create test follow-up in database
- [ ] Set `dueDate` to today or earlier
- [ ] Set `completed` to false
- [ ] Verify follow-up is created

### Test Cron Job Locally
- [ ] Make GET request to `/api/cron/send-followups`
- [ ] Add header: `Authorization: Bearer test-secret`
- [ ] Verify response includes:
  - [ ] `success: true`
  - [ ] `followUpsSent: 1`
  - [ ] `totalProcessed: 1`

### Deploy Cron Job (Vercel)
- [ ] Create `vercel.json` in project root:
  ```json
  {
    "crons": [{
      "path": "/api/cron/send-followups",
      "schedule": "0 9 * * *"
    }]
  }
  ```
- [ ] Set `CRON_SECRET` in Vercel environment variables
- [ ] Deploy to Vercel
- [ ] Verify cron job runs at scheduled time
- [ ] Check logs for successful execution

## Phase 9: Monitoring & Maintenance

### Monitor Message Delivery
- [ ] Check message delivery rates
- [ ] Monitor failed messages
- [ ] Review error logs
- [ ] Track API usage in Twilio Console

### Monitor Webhook
- [ ] Check webhook success rate
- [ ] Monitor webhook errors
- [ ] Review incoming message logs
- [ ] Verify sentiment detection accuracy

### Monitor Costs
- [ ] Check Twilio usage in Console
- [ ] Monitor message costs
- [ ] Set up billing alerts
- [ ] Review monthly costs

### Regular Maintenance
- [ ] Review and update error handling
- [ ] Improve sentiment detection if needed
- [ ] Add new message templates
- [ ] Optimize database queries
- [ ] Update documentation

## Phase 10: Advanced Features (Optional)

### Custom Message Templates
- [ ] Create reusable message templates
- [ ] Add template variables
- [ ] Test template substitution
- [ ] Document templates

### Enhanced Sentiment Analysis
- [ ] Integrate AI/NLP service (OpenAI, etc.)
- [ ] Improve sentiment detection accuracy
- [ ] Add emotion detection
- [ ] Add intent detection

### Automated Responses
- [ ] Set up auto-response for incoming messages
- [ ] Create escalation rules
- [ ] Add task creation for urgent messages
- [ ] Notify team of important messages

### Message Scheduling
- [ ] Add ability to schedule messages
- [ ] Create message queue
- [ ] Add retry logic for failed messages
- [ ] Track scheduled message status

## Completion Checklist

- [ ] All phases completed
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Code reviewed and approved
- [ ] Production deployed
- [ ] Monitoring set up
- [ ] Team trained on usage
- [ ] Ready for production use

---

## Notes

Use this space to track any issues, decisions, or notes:

```
[Add your notes here]
```

---

**Status**: Ready for Implementation
**Last Updated**: April 2026
**Version**: 1.0
