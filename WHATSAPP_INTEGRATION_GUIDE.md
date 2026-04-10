# WhatsApp Integration Guide
## Proactive AI Relationship Manager CRM

**Version**: 1.0  
**Last Updated**: April 10, 2026  
**Status**: ✅ Ready for QA Testing  

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [API Reference](#api-reference)
5. [UI Components](#ui-components)
6. [Database Schema](#database-schema)
7. [Sentiment Analysis](#sentiment-analysis)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The WhatsApp integration enables the CRM to send and receive WhatsApp messages directly from the dashboard. This feature includes:

- **Message Sending**: Send custom or templated messages to clients
- **Incoming Messages**: Automatically process incoming WhatsApp messages
- **Sentiment Analysis**: Analyze message sentiment and update client health status
- **Message Tracking**: Track delivery status of sent messages
- **Follow-Up Automation**: Schedule and send automated follow-up messages
- **Complaint Management**: Track and manage client complaints

### Key Features

✅ **Send Messages**
- Custom message composition
- Pre-built message templates
- Character counter
- Real-time delivery status

✅ **Receive Messages**
- Automatic webhook processing
- Sentiment analysis
- Client health status updates
- AI insights generation

✅ **Templates**
- Follow-up messages
- Complaint acknowledgments
- Resolution confirmations
- General messages

✅ **Automation**
- Scheduled follow-ups
- Complaint escalation
- Health status updates
- AI-powered suggestions

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│                                                              │
│  - Dashboard with client list                               │
│  - WhatsApp sender dialog component                         │
│  - Message templates                                        │
│  - Interaction history                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Layer                         │
│                                                              │
│  - POST /api/whatsapp/send (send messages)                  │
│  - POST /api/whatsapp/webhook (receive messages)            │
│  - GET /api/whatsapp/status (check delivery)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Service                          │
│                                                              │
│  - Message sending logic                                    │
│  - Webhook validation                                       │
│  - Sentiment analysis                                       │
│  - Status tracking                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│                                                              │
│  - Twilio WhatsApp Business API                             │
│  - PostgreSQL Database                                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Sending a Message**:
```
User clicks "Send WhatsApp" 
    ↓
Selects template or writes custom message
    ↓
Clicks "Send Message" button
    ↓
POST /api/whatsapp/send
    ↓
Validate client exists
    ↓
Call Twilio API
    ↓
Log interaction to database
    ↓
Update client lastInteractionDate
    ↓
Return success response
    ↓
Show success toast notification
```

**Receiving a Message**:
```
Client sends WhatsApp message
    ↓
Twilio receives message
    ↓
Twilio sends webhook to /api/whatsapp/webhook
    ↓
Validate webhook signature
    ↓
Parse message content
    ↓
Analyze sentiment
    ↓
Extract key points
    ↓
Update client health status
    ↓
Create interaction record
    ↓
Generate AI insights (if needed)
    ↓
Return 200 OK to Twilio
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Twilio account with WhatsApp Business API enabled
- npm or yarn package manager

### Step 1: Install Dependencies

```bash
cd /home/code/crm-relationship-manager
npm install
```

### Step 2: Configure Environment Variables

Create `.env.local` file in project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crm_relationship_manager"

# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID="your_account_sid_here"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_WHATSAPP_NUMBER="+1234567890"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**How to get Twilio credentials**:

1. Visit [Twilio Console](https://www.twilio.com/console)
2. Log in to your account
3. Find "Account SID" and "Auth Token" on the dashboard
4. Go to Messaging → WhatsApp to get your WhatsApp number

### Step 3: Set Up Database

```bash
# Create database
createdb -h localhost -U $PGUSER crm_relationship_manager

# Run migrations
npx prisma migrate dev --name init

# Seed test data (optional)
npx prisma db seed
```

### Step 4: Configure Twilio Webhook

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Navigate to Messaging → WhatsApp → Sandbox Settings
3. Set "When a message comes in" webhook URL to:
   ```
   https://your-domain.com/api/whatsapp/webhook
   ```
   (For local development, use ngrok or similar to expose localhost)

4. Set HTTP method to `POST`
5. Save settings

### Step 5: Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

### Step 6: Verify Installation

1. Navigate to dashboard: `http://localhost:3000`
2. Click on a client
3. Look for "Send WhatsApp" button
4. Click to open WhatsApp sender dialog
5. Verify dialog displays correctly

---

## API Reference

### POST /api/whatsapp/send

Send a WhatsApp message to a client.

**Request**:
```json
{
  "clientId": "client_uuid",
  "message": "Hi John, just checking in!",
  "type": "FOLLOW_UP"
}
```

**Parameters**:
- `clientId` (string, required): UUID of the client
- `message` (string, required): Message content (max 1600 characters)
- `type` (string, optional): Message type for logging
  - `FOLLOW_UP`: Follow-up message
  - `COMPLAINT_ACK`: Complaint acknowledgment
  - `RESOLUTION`: Resolution confirmation
  - `NOTIFICATION`: General notification

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "messageSid": "SM1234567890abcdef1234567890abcdef",
  "interactionId": "interaction_uuid",
  "clientName": "John Smith",
  "clientPhone": "+14155552671"
}
```

**Response (Error - 400/404)**:
```json
{
  "error": "Client not found"
}
```

**Error Codes**:
- `400`: Missing required fields or invalid input
- `404`: Client not found
- `500`: Server error or Twilio API error

**Example Usage**:
```typescript
const response = await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId: 'client-123',
    message: 'Hi John, how are things going?',
    type: 'FOLLOW_UP'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Message sent:', data.messageSid);
}
```

---

### POST /api/whatsapp/webhook

Receive and process incoming WhatsApp messages from Twilio.

**Webhook Payload** (sent by Twilio):
```
From: whatsapp:+14155552671
To: whatsapp:+1234567890
Body: Great progress on the project!
MessageSid: SM1234567890abcdef1234567890abcdef
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Message processed",
  "interactionId": "interaction_uuid"
}
```

**Processing Steps**:
1. Validate Twilio signature
2. Extract message content
3. Find client by phone number
4. Analyze sentiment
5. Extract key points
6. Update client health status
7. Create interaction record
8. Generate AI insights (if needed)

**Security**:
- All webhooks are validated using HMAC-SHA1 signature
- Invalid signatures are rejected with 403 Forbidden
- Signature validation uses `TWILIO_AUTH_TOKEN`

---

### GET /api/whatsapp/status

Check the delivery status of a sent message.

**Query Parameters**:
- `messageSid` (string, required): Message SID from send response

**Response (200)**:
```json
{
  "success": true,
  "messageSid": "SM1234567890abcdef1234567890abcdef",
  "status": "delivered",
  "dateSent": "2026-04-10T12:00:00Z",
  "dateUpdated": "2026-04-10T12:00:05Z",
  "errorCode": null,
  "errorMessage": null
}
```

**Status Values**:
- `queued`: Message is queued for sending
- `sent`: Message was sent to Twilio
- `delivered`: Message was delivered to recipient
- `failed`: Message failed to send
- `undelivered`: Message could not be delivered

**Example Usage**:
```typescript
const response = await fetch(
  '/api/whatsapp/status?messageSid=SM1234567890abcdef1234567890abcdef'
);
const data = await response.json();
console.log('Message status:', data.status);
```

---

## UI Components

### WhatsApp Sender Component

**Location**: `components/whatsapp-sender.tsx`

**Props**:
```typescript
interface WhatsAppSenderProps {
  clientId: string;
  clientName: string;
  clientPhone: string;
  onClose: () => void;
  onSuccess?: (messageSid: string) => void;
}
```

**Features**:
- Template selection buttons
- Custom message textarea
- Character counter
- Send button with loading state
- Success/error notifications

**Usage**:
```tsx
import { WhatsAppSender } from '@/components/whatsapp-sender';

export function ClientDetail({ client }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Send WhatsApp
      </button>
      
      {isOpen && (
        <WhatsAppSender
          clientId={client.id}
          clientName={client.name}
          clientPhone={client.phone}
          onClose={() => setIsOpen(false)}
          onSuccess={(messageSid) => {
            console.log('Message sent:', messageSid);
          }}
        />
      )}
    </>
  );
}
```

### Message Templates

**Available Templates**:

1. **Follow-Up**
   ```
   Hi [Name], just checking in! How are things progressing with [project/service]? 
   Let me know if you need anything from our end. Looking forward to hearing from you!
   ```

2. **Complaint Acknowledgment**
   ```
   Hi [Name], thank you for reporting this issue. We've received your complaint and 
   are looking into it right away. We appreciate your patience and will get back to 
   you with an update soon.
   ```

3. **Resolution Confirmation**
   ```
   Hi [Name], we're happy to let you know that your issue has been resolved! 
   Thank you for your patience and for bringing this to our attention. 
   Please let us know if you need anything else.
   ```

4. **General Message**
   ```
   [Custom message - user can write anything]
   ```

---

## Database Schema

### Client Table

```sql
CREATE TABLE "Client" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  company VARCHAR(255),
  healthStatus VARCHAR(50) DEFAULT 'YELLOW',
  lastInteractionDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields**:
- `id`: Unique identifier
- `name`: Client name
- `email`: Client email address
- `phone`: WhatsApp phone number (E.164 format: +1234567890)
- `company`: Company name
- `healthStatus`: GREEN (healthy), YELLOW (inactive), RED (at risk)
- `lastInteractionDate`: Timestamp of last interaction
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

### Interaction Table

```sql
CREATE TABLE "Interaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clientId UUID NOT NULL REFERENCES "Client"(id),
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  content TEXT,
  sentiment VARCHAR(50),
  keyPoints TEXT[],
  handledBy VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields**:
- `id`: Unique identifier
- `clientId`: Reference to client
- `type`: WHATSAPP, EMAIL, CALL, etc.
- `subject`: Interaction subject
- `content`: Full message content
- `sentiment`: POSITIVE, NEGATIVE, NEUTRAL
- `keyPoints`: Array of extracted key points
- `handledBy`: Who handled the interaction
- `createdAt`: Timestamp
- `updatedAt`: Last update timestamp

### FollowUp Table

```sql
CREATE TABLE "FollowUp" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clientId UUID NOT NULL REFERENCES "Client"(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduledFor TIMESTAMP NOT NULL,
  method VARCHAR(50) DEFAULT 'WHATSAPP',
  status VARCHAR(50) DEFAULT 'PENDING',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields**:
- `id`: Unique identifier
- `clientId`: Reference to client
- `title`: Follow-up title
- `description`: Follow-up description
- `scheduledFor`: When to send follow-up
- `method`: WHATSAPP, EMAIL, CALL, etc.
- `status`: PENDING, SENT, COMPLETED, CANCELLED
- `createdAt`: Timestamp
- `updatedAt`: Last update timestamp

---

## Sentiment Analysis

### How It Works

The sentiment analysis engine uses keyword-based analysis to determine message sentiment:

1. **Tokenization**: Split message into words
2. **Keyword Matching**: Check against positive/negative keyword lists
3. **Scoring**: Calculate sentiment score
4. **Classification**: Determine POSITIVE, NEGATIVE, or NEUTRAL

### Positive Keywords

```
excellent, great, good, happy, satisfied, pleased, wonderful, 
fantastic, amazing, perfect, love, awesome, brilliant, outstanding,
impressed, delighted, thrilled, grateful, appreciate, thank, thanks
```

### Negative Keywords

```
terrible, awful, bad, unhappy, disappointed, angry, frustrated,
horrible, disgusting, hate, worst, poor, complaint, issue, problem,
broken, failed, error, bug, crash, slow, useless, waste, regret
```

### Sentiment Scoring

```
Score = (positive_count - negative_count) / total_words

POSITIVE: score > 0.1
NEGATIVE: score < -0.1
NEUTRAL: -0.1 <= score <= 0.1
```

### Client Health Status Updates

Based on sentiment:

```
POSITIVE sentiment → GREEN (Healthy)
NEGATIVE sentiment → RED (At Risk)
NEUTRAL sentiment → No change
```

### Example

**Message**: "Great progress on the project! Everything is working perfectly."

**Analysis**:
- Positive keywords: "Great" (1), "working" (1), "perfectly" (1) = 3
- Negative keywords: 0
- Score: (3 - 0) / 8 = 0.375
- **Result**: POSITIVE sentiment → Update client to GREEN

---

## Error Handling

### API Error Responses

**400 Bad Request**:
```json
{
  "error": "Missing required field: clientId"
}
```

**404 Not Found**:
```json
{
  "error": "Client not found"
}
```

**403 Forbidden** (webhook):
```json
{
  "error": "Invalid webhook signature"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to send message: Twilio API error"
}
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Client not found" | Invalid clientId | Verify client exists in database |
| "Client does not have a phone number" | Missing phone field | Add phone number to client |
| "Invalid webhook signature" | Wrong auth token | Verify TWILIO_AUTH_TOKEN is correct |
| "Failed to send message" | Twilio API error | Check Twilio account status, verify credentials |
| "Message not received" | Webhook not configured | Set webhook URL in Twilio console |

### Logging

All errors are logged to console with context:

```
[WhatsApp] Error sending message to client john-123: Client not found
[WhatsApp] Webhook signature validation failed
[WhatsApp] Sentiment analysis for message: POSITIVE
```

---

## Testing

### Unit Tests

Test individual functions:

```typescript
import { determineSentiment, extractKeyPoints } from '@/lib/whatsapp';

describe('Sentiment Analysis', () => {
  it('should detect positive sentiment', () => {
    const sentiment = determineSentiment('Great work! I love it!');
    expect(sentiment).toBe('POSITIVE');
  });

  it('should detect negative sentiment', () => {
    const sentiment = determineSentiment('This is terrible and broken');
    expect(sentiment).toBe('NEGATIVE');
  });

  it('should detect neutral sentiment', () => {
    const sentiment = determineSentiment('The weather is nice today');
    expect(sentiment).toBe('NEUTRAL');
  });
});

describe('Key Point Extraction', () => {
  it('should extract key points', () => {
    const points = extractKeyPoints('We have an issue with the service. Can you help?');
    expect(points.length).toBeGreaterThan(0);
    expect(points).toContain('issue');
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
describe('POST /api/whatsapp/send', () => {
  it('should send message successfully', async () => {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'test-client-id',
        message: 'Test message'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.messageSid).toBeDefined();
  });

  it('should return 404 for non-existent client', async () => {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'non-existent',
        message: 'Test message'
      })
    });

    expect(response.status).toBe(404);
  });
});
```

### Manual Testing

See `QA_TEST_PLAN.md` for comprehensive manual testing procedures.

---

## Troubleshooting

### Issue: "WhatsApp integration not configured"

**Cause**: Missing Twilio credentials

**Solution**:
1. Check `.env.local` file exists
2. Verify all three variables are set:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER`
3. Restart dev server: `npm run dev`

### Issue: "Invalid webhook signature"

**Cause**: Webhook signature validation failed

**Solution**:
1. Verify `TWILIO_AUTH_TOKEN` is correct
2. Check webhook URL in Twilio console matches your app URL
3. Ensure webhook is configured as POST method
4. Test with Twilio's webhook testing tool

### Issue: "Message not sending"

**Cause**: Twilio API error or network issue

**Solution**:
1. Check Twilio account status (not suspended)
2. Verify WhatsApp Business Account is approved
3. Check client phone number is in E.164 format (+1234567890)
4. Check network connectivity
5. Review Twilio logs for error details

### Issue: "Client not found"

**Cause**: Invalid clientId or client doesn't exist

**Solution**:
1. Verify clientId is correct UUID
2. Check client exists in database:
   ```sql
   SELECT * FROM "Client" WHERE id = 'your-client-id';
   ```
3. Create test client if needed

### Issue: "Client does not have a phone number"

**Cause**: Client record missing phone field

**Solution**:
1. Update client with phone number:
   ```sql
   UPDATE "Client" SET phone = '+14155552671' WHERE id = 'client-id';
   ```
2. Verify phone format is E.164 (+1234567890)

### Issue: "Sentiment analysis not working"

**Cause**: Sentiment analysis function error

**Solution**:
1. Check message content is not empty
2. Verify keyword lists are loaded
3. Check for JavaScript errors in console
4. Review sentiment analysis logs

### Debug Mode

Enable detailed logging:

```typescript
// In lib/whatsapp.ts
const DEBUG = true;

if (DEBUG) {
  console.log('[WhatsApp Debug]', message);
}
```

---

## Performance Considerations

### Message Sending
- **Expected time**: < 2 seconds
- **Bottleneck**: Twilio API response time
- **Optimization**: Use message templates for faster sending

### Webhook Processing
- **Expected time**: < 1 second
- **Bottleneck**: Database operations
- **Optimization**: Index phone number field for faster lookups

### Sentiment Analysis
- **Expected time**: < 100ms
- **Bottleneck**: Keyword matching
- **Optimization**: Pre-compile keyword regex patterns

### Database Queries
- **Recommended indexes**:
  ```sql
  CREATE INDEX idx_client_phone ON "Client"(phone);
  CREATE INDEX idx_interaction_client ON "Interaction"(clientId);
  CREATE INDEX idx_followup_client ON "FollowUp"(clientId);
  ```

---

## Security Best Practices

✅ **Always validate webhook signatures**
- Prevents spoofed requests
- Uses HMAC-SHA1 validation
- Implemented in webhook handler

✅ **Never log sensitive data**
- Don't log phone numbers
- Don't log message content
- Don't log API credentials

✅ **Use environment variables**
- Store credentials in `.env.local`
- Never commit credentials to git
- Use `.env.example` for documentation

✅ **Validate all inputs**
- Check phone number format
- Validate message length
- Verify client exists

✅ **Handle errors gracefully**
- Don't expose internal errors
- Return generic error messages
- Log detailed errors server-side

---

## Support & Resources

### Documentation
- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Twilio Message Status](https://www.twilio.com/docs/sms/api/message-resource#message-status-values)
- [Twilio Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

### Testing Tools
- [Twilio Console](https://www.twilio.com/console)
- [Postman](https://www.postman.com/) - for API testing
- [ngrok](https://ngrok.com/) - for local webhook testing

### Getting Help
- Check `QA_TEST_PLAN.md` for test cases
- Review error logs in console
- Check Twilio account status
- Verify environment variables

---

## Changelog

### Version 1.0 (April 10, 2026)
- Initial WhatsApp integration implementation
- Message sending and receiving
- Sentiment analysis
- Message status tracking
- Webhook processing
- Database integration
- UI component
- Comprehensive documentation

---

**End of WhatsApp Integration Guide**

For questions or issues, refer to the troubleshooting section or contact the development team.
