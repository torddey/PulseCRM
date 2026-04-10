# WhatsApp Integration QA Test Plan
## Proactive AI Relationship Manager CRM

**Project**: crm-relationship-manager  
**Feature**: WhatsApp Business API Integration via Twilio  
**Test Date**: April 10, 2026  
**Tester**: QA Team  

---

## 📋 Test Overview

This document outlines comprehensive QA testing for the WhatsApp messaging feature integrated into the Proactive AI Relationship Manager CRM.

### Test Scope
- ✅ WhatsApp message sending via dashboard UI
- ✅ Incoming WhatsApp message processing (webhook)
- ✅ Sentiment analysis and client health updates
- ✅ Message delivery status tracking
- ✅ Automated follow-up logic
- ✅ Database integration and data persistence
- ✅ Error handling and edge cases

### Test Environment
- **Database**: PostgreSQL (crm_relationship_manager)
- **API Server**: Next.js (localhost:3000)
- **Test Clients**: 3 pre-created test clients with phone numbers
- **Integration**: Twilio Business API (requires credentials)

---

## 🧪 Test Data

### Test Clients Created
```
1. John Smith
   - Email: john.smith@example.com
   - Phone: +14155552671
   - Status: GREEN (Healthy)
   - Company: Acme Corp

2. Jane Doe
   - Email: jane.doe@example.com
   - Phone: +14155552672
   - Status: YELLOW (Inactive)
   - Company: Tech Solutions Inc

3. Bob Johnson
   - Email: bob.johnson@example.com
   - Phone: +14155552673
   - Status: RED (At Risk)
   - Company: Global Industries
```

### Test Interactions Created
```
1. Interaction 1 (Client: John Smith)
   - Type: EMAIL
   - Subject: Project Update
   - Content: Great progress on the project! Everything is on track.
   - Sentiment: POSITIVE
   - Handler: Sarah

2. Interaction 2 (Client: Bob Johnson)
   - Type: CALL
   - Subject: Complaint - Service Issue
   - Content: Client reported issues with service delivery. Very unhappy.
   - Sentiment: NEGATIVE
   - Handler: Mike
```

### Test Follow-Ups Created
```
1. Follow-Up 1 (Client: John Smith)
   - Title: Check Project Status
   - Description: Follow up on project progress
   - Scheduled: 3 days from now
   - Method: WHATSAPP
   - Status: PENDING

2. Follow-Up 2 (Client: Jane Doe)
   - Title: Re-engagement Call
   - Description: Reach out to inactive client
   - Scheduled: 1 day from now
   - Method: WHATSAPP
   - Status: PENDING
```

---

## 🔧 Prerequisites

### Environment Setup
- [ ] Twilio account created
- [ ] WhatsApp Business API enabled
- [ ] Twilio credentials obtained:
  - [ ] TWILIO_ACCOUNT_SID
  - [ ] TWILIO_AUTH_TOKEN
  - [ ] TWILIO_WHATSAPP_NUMBER
- [ ] Credentials added to `.env.local`
- [ ] Dev server running (`npm run dev`)
- [ ] Database populated with test data

### Files to Test
```
lib/whatsapp.ts                    # Core WhatsApp service
app/api/whatsapp/send/route.ts     # Send message API
app/api/whatsapp/webhook/route.ts  # Incoming message handler
app/api/whatsapp/status/route.ts   # Message status API
components/whatsapp-sender.tsx     # UI component
```

---

## 🧪 Test Cases

### TEST 1: WhatsApp Sender Component UI
**Objective**: Verify the WhatsApp sender dialog loads and displays correctly

**Steps**:
1. Navigate to dashboard (localhost:3000)
2. Click on a client (e.g., John Smith)
3. Look for "Send WhatsApp" button
4. Click the button to open dialog

**Expected Results**:
- [ ] Dialog opens with title "Send WhatsApp Message"
- [ ] Client name and phone number displayed
- [ ] Quick template buttons visible (Follow-Up, Complaint Ack, Resolution, General)
- [ ] Message textarea is empty and ready for input
- [ ] Send button is disabled (no message yet)
- [ ] Cancel button is functional

**Pass/Fail**: ___________

---

### TEST 2: Message Template Selection
**Objective**: Verify template selection populates message correctly

**Steps**:
1. Open WhatsApp sender dialog (from TEST 1)
2. Click "Follow-Up" template button
3. Verify message textarea content
4. Click "Complaint Acknowledgment" template
5. Verify message changes
6. Click "Resolution Confirmation" template
7. Verify message changes

**Expected Results**:
- [ ] Follow-Up template: "Hi [Name], just checking in! How are things progressing?..."
- [ ] Complaint Ack template: "Hi [Name], thank you for reporting this issue..."
- [ ] Resolution template: "Hi [Name], we're happy to let you know that your issue has been resolved..."
- [ ] Each template includes client name
- [ ] Templates are customizable (can edit text)

**Pass/Fail**: ___________

---

### TEST 3: Custom Message Composition
**Objective**: Verify ability to write and send custom messages

**Steps**:
1. Open WhatsApp sender dialog
2. Click "General Message" template
3. Clear the default text
4. Type custom message: "Hi John, just wanted to check in on your project. How's everything going?"
5. Verify character count updates
6. Click "Send Message" button

**Expected Results**:
- [ ] Character count displays and updates as you type
- [ ] Send button becomes enabled when message has content
- [ ] Send button shows loading state while sending
- [ ] Success message appears: "Message sent to [Client Name]"
- [ ] Dialog closes after 1.5 seconds
- [ ] No console errors

**Pass/Fail**: ___________

---

### TEST 4: Message Sending API (POST /api/whatsapp/send)
**Objective**: Verify API correctly sends message and logs interaction

**Steps**:
1. Use curl or Postman to test API directly:
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client1",
    "message": "Test message from QA",
    "type": "NOTIFICATION"
  }'
```

**Expected Results**:
- [ ] API returns 200 status code
- [ ] Response includes:
  - [ ] `success: true`
  - [ ] `messageSid` (unique message identifier)
  - [ ] `interactionId` (database record ID)
  - [ ] `clientName` and `clientPhone`
- [ ] Interaction logged in database
- [ ] Client's `lastInteractionDate` updated
- [ ] No console errors

**Pass/Fail**: ___________

---

### TEST 5: Error Handling - Missing Client
**Objective**: Verify API handles missing client gracefully

**Steps**:
1. Send API request with non-existent clientId:
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "nonexistent",
    "message": "Test message"
  }'
```

**Expected Results**:
- [ ] API returns 404 status code
- [ ] Response includes error: "Client not found"
- [ ] No interaction created in database
- [ ] No exception thrown

**Pass/Fail**: ___________

---

### TEST 6: Error Handling - Missing Phone Number
**Objective**: Verify API handles client without phone number

**Steps**:
1. Create test client without phone number (if possible)
2. Send message to that client
3. Observe error handling

**Expected Results**:
- [ ] API returns 400 status code
- [ ] Response includes error: "Client does not have a phone number"
- [ ] No message sent to Twilio
- [ ] No interaction created

**Pass/Fail**: ___________

---

### TEST 7: Webhook Signature Validation
**Objective**: Verify webhook validates Twilio signature

**Steps**:
1. Send POST request to webhook with invalid signature:
```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "x-twilio-signature: invalid_signature" \
  -d "From=whatsapp:%2B14155552671&Body=Test+message"
```

**Expected Results**:
- [ ] API returns 403 status code
- [ ] Response includes error: "Invalid signature"
- [ ] No interaction created
- [ ] Request is rejected

**Pass/Fail**: ___________

---

### TEST 8: Incoming Message Processing
**Objective**: Verify webhook correctly processes incoming messages

**Steps**:
1. Send valid webhook request (with proper Twilio signature):
```bash
# Note: This requires valid Twilio signature
# In production, Twilio sends this automatically
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "x-twilio-signature: [VALID_SIGNATURE]" \
  -d "From=whatsapp:%2B14155552671&Body=Great+progress+on+the+project"
```

**Expected Results**:
- [ ] API returns 200 status code
- [ ] Interaction created in database with:
  - [ ] `type: WHATSAPP`
  - [ ] `content: "Great progress on the project"`
  - [ ] `sentiment: POSITIVE` (detected from keywords)
  - [ ] `handledBy: "WhatsApp Webhook"`
- [ ] Client's `lastInteractionDate` updated
- [ ] Client's `healthStatus` updated based on sentiment

**Pass/Fail**: ___________

---

### TEST 9: Sentiment Analysis - Positive
**Objective**: Verify positive sentiment detection

**Steps**:
1. Send webhook with positive message:
```
"Great! Everything is working perfectly. Very happy with the service!"
```

**Expected Results**:
- [ ] Sentiment detected as: POSITIVE
- [ ] Client health status updated to: GREEN
- [ ] Key points extracted: ["Great", "working perfectly", "happy"]

**Pass/Fail**: ___________

---

### TEST 10: Sentiment Analysis - Negative
**Objective**: Verify negative sentiment detection

**Steps**:
1. Send webhook with negative message:
```
"This is terrible! Very unhappy with the service. Need immediate help!"
```

**Expected Results**:
- [ ] Sentiment detected as: NEGATIVE
- [ ] Client health status updated to: RED
- [ ] AI Insight created with type: COMPLAINT_ALERT
- [ ] Key points extracted: ["terrible", "unhappy", "immediate help"]

**Pass/Fail**: ___________

---

### TEST 11: Sentiment Analysis - Neutral
**Objective**: Verify neutral sentiment detection

**Steps**:
1. Send webhook with neutral message:
```
"Just checking in. How are things?"
```

**Expected Results**:
- [ ] Sentiment detected as: NEUTRAL
- [ ] Client health status remains unchanged
- [ ] No AI Insight created

**Pass/Fail**: ___________

---

### TEST 12: Message Status API (GET /api/whatsapp/status)
**Objective**: Verify ability to check message delivery status

**Steps**:
1. Send a message and capture the messageSid
2. Query status API:
```bash
curl "http://localhost:3000/api/whatsapp/status?messageSid=SM1234567890"
```

**Expected Results**:
- [ ] API returns 200 status code
- [ ] Response includes:
  - [ ] `messageSid`
  - [ ] `status` (queued, sent, delivered, failed, etc.)
  - [ ] `dateSent`
  - [ ] `dateUpdated`
  - [ ] `errorCode` (if applicable)
  - [ ] `errorMessage` (if applicable)

**Pass/Fail**: ___________

---

### TEST 13: Status API - Missing Parameter
**Objective**: Verify error handling for missing messageSid

**Steps**:
1. Call status API without messageSid:
```bash
curl "http://localhost:3000/api/whatsapp/status"
```

**Expected Results**:
- [ ] API returns 400 status code
- [ ] Response includes error: "Missing required parameter: messageSid"

**Pass/Fail**: ___________

---

### TEST 14: Database Interaction Logging
**Objective**: Verify all interactions are properly logged

**Steps**:
1. Send 3 messages via UI
2. Query database:
```sql
SELECT * FROM "Interaction" WHERE type = 'WHATSAPP' ORDER BY "createdAt" DESC LIMIT 3;
```

**Expected Results**:
- [ ] 3 interactions found
- [ ] Each has:
  - [ ] `clientId` (correct client)
  - [ ] `type: WHATSAPP`
  - [ ] `content` (message text)
  - [ ] `sentiment` (POSITIVE, NEGATIVE, or NEUTRAL)
  - [ ] `keyPoints` (array of extracted points)
  - [ ] `createdAt` (timestamp)

**Pass/Fail**: ___________

---

### TEST 15: Client Health Status Updates
**Objective**: Verify client health status updates based on interactions

**Steps**:
1. Check initial client status:
```sql
SELECT id, name, "healthStatus" FROM "Client" WHERE id = 'client3';
```
2. Send negative sentiment message from that client
3. Check updated status:
```sql
SELECT id, name, "healthStatus" FROM "Client" WHERE id = 'client3';
```

**Expected Results**:
- [ ] Initial status: RED (at risk)
- [ ] After negative message: RED (remains at risk)
- [ ] `lastInteractionDate` updated to current time

**Pass/Fail**: ___________

---

### TEST 16: Automated Follow-Up Logic
**Objective**: Verify follow-up messages are triggered correctly

**Steps**:
1. Check pending follow-ups:
```sql
SELECT * FROM "FollowUp" WHERE status = 'PENDING' AND "scheduledFor" <= NOW();
```
2. Verify follow-up should be sent
3. Check if automated message was sent (if cron job is running)

**Expected Results**:
- [ ] Pending follow-ups identified
- [ ] Follow-up messages sent via WhatsApp
- [ ] Follow-up status updated to SENT
- [ ] Interaction logged for each follow-up

**Pass/Fail**: ___________

---

### TEST 17: Complaint Acknowledgment Flow
**Objective**: Verify complaint acknowledgment message is sent correctly

**Steps**:
1. Open WhatsApp sender for Bob Johnson (RED status client)
2. Select "Complaint Acknowledgment" template
3. Send message
4. Verify in database

**Expected Results**:
- [ ] Message sent successfully
- [ ] Message includes: "thank you for reporting", "received your complaint", "looking into it"
- [ ] Interaction logged with subject: "WhatsApp COMPLAINT_ACK"
- [ ] Client's lastInteractionDate updated

**Pass/Fail**: ___________

---

### TEST 18: Resolution Message Flow
**Objective**: Verify resolution message is sent correctly

**Steps**:
1. Open WhatsApp sender for Bob Johnson
2. Select "Resolution Confirmation" template
3. Send message
4. Verify in database

**Expected Results**:
- [ ] Message sent successfully
- [ ] Message includes: "happy to let you know", "resolved", "thank you for your patience"
- [ ] Interaction logged with subject: "WhatsApp RESOLUTION"
- [ ] Client's healthStatus updated to GREEN

**Pass/Fail**: ___________

---

### TEST 19: Console Error Check
**Objective**: Verify no JavaScript errors in browser console

**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform all UI tests (send messages, open dialogs, etc.)
4. Check for errors

**Expected Results**:
- [ ] No red error messages
- [ ] No TypeScript errors
- [ ] No Next.js runtime errors
- [ ] No network errors (404, 500, etc.)
- [ ] Only informational logs (if any)

**Pass/Fail**: ___________

---

### TEST 20: API Health Check
**Objective**: Verify all API endpoints are accessible

**Steps**:
1. Test send endpoint:
```bash
curl -X GET http://localhost:3000/api/whatsapp/send
```
2. Test webhook endpoint:
```bash
curl -X GET http://localhost:3000/api/whatsapp/webhook
```
3. Test status endpoint:
```bash
curl -X GET http://localhost:3000/api/whatsapp/status
```

**Expected Results**:
- [ ] All endpoints return 200 status
- [ ] Send endpoint: "WhatsApp send API is active"
- [ ] Webhook endpoint: "WhatsApp webhook is active"
- [ ] Status endpoint: Returns 400 (missing parameter) - expected

**Pass/Fail**: ___________

---

## 📊 Test Summary

### Test Results
- **Total Tests**: 20
- **Passed**: _____ / 20
- **Failed**: _____ / 20
- **Blocked**: _____ / 20

### Critical Issues Found
```
1. [Issue #1]
   - Test: [Test Name]
   - Severity: CRITICAL / HIGH / MEDIUM / LOW
   - Description: [Description]
   - Steps to Reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]
   - Fix: [Suggested fix]

2. [Issue #2]
   ...
```

### Recommendations
- [ ] All critical issues resolved
- [ ] All high-priority issues resolved
- [ ] Code review completed
- [ ] Performance acceptable
- [ ] Security review completed
- [ ] Ready for production deployment

---

## 🚀 Sign-Off

**QA Tester**: ___________________  
**Date**: ___________________  
**Status**: ☐ PASS ☐ FAIL ☐ CONDITIONAL PASS  

**Notes**:
```
[Additional notes, observations, or recommendations]
```

---

## 📚 Reference Documentation

### WhatsApp Integration Files
- `lib/whatsapp.ts` - Core service with all WhatsApp functions
- `app/api/whatsapp/send/route.ts` - Message sending endpoint
- `app/api/whatsapp/webhook/route.ts` - Incoming message handler
- `app/api/whatsapp/status/route.ts` - Message status checker
- `components/whatsapp-sender.tsx` - UI component for sending messages

### Key Functions
- `sendWhatsAppMessage()` - Send message to client
- `sendWhatsAppTemplate()` - Send templated message
- `validateWebhookSignature()` - Verify Twilio webhook
- `parseIncomingMessage()` - Extract message data
- `getMessageStatus()` - Check delivery status
- `sendFollowUpMessage()` - Send follow-up
- `sendComplaintAcknowledgment()` - Send complaint ack
- `sendResolutionMessage()` - Send resolution

### Twilio Resources
- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Message Status Values](https://www.twilio.com/docs/sms/api/message-resource#message-status-values)
- [Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

---

**End of QA Test Plan**
