# 🔌 API Examples - Complete Reference

Your CRM has 5 main API endpoints. Use these examples to integrate with external systems or build custom workflows.

---

## 📋 Base URL

```
http://localhost:3000/api
```

All endpoints return JSON responses.

---

## 1️⃣ Clients API

### Create a Client
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp"
  }'
```

**Response:**
```json
{
  "id": "clx123abc",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "healthStatus": "HEALTHY",
  "lastInteractionDate": null,
  "nextFollowUpDate": null,
  "createdAt": "2026-04-10T11:00:00Z",
  "updatedAt": "2026-04-10T11:00:00Z"
}
```

### Get All Clients
```bash
curl http://localhost:3000/api/clients
```

**Response:**
```json
[
  {
    "id": "clx123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "healthStatus": "HEALTHY",
    "lastInteractionDate": "2026-04-10T10:30:00Z",
    "nextFollowUpDate": "2026-04-17T14:00:00Z"
  }
]
```

### Get Single Client
```bash
curl http://localhost:3000/api/clients?id=clx123abc
```

---

## 2️⃣ Interactions API

### Log an Interaction
```bash
curl -X POST http://localhost:3000/api/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "clx123abc",
    "type": "CALL",
    "subject": "Project Status Check",
    "content": "Discussed project timeline and deliverables. Client is satisfied with progress.",
    "handledBy": "Sarah Johnson",
    "sentiment": "POSITIVE",
    "keyPoints": [
      "Project on track",
      "Budget approved",
      "Next milestone: April 20"
    ]
  }'
```

**Interaction Types:**
- `CALL` - Phone call
- `EMAIL` - Email communication
- `SMS` - Text message
- `WHATSAPP` - WhatsApp message
- `MEETING` - In-person or video meeting
- `NOTE` - Internal note
- `FEEDBACK` - Customer feedback

**Sentiment Values:**
- `POSITIVE` - Client is happy
- `NEUTRAL` - Normal conversation
- `NEGATIVE` - Client is upset

**Response:**
```json
{
  "id": "clx456def",
  "clientId": "clx123abc",
  "type": "CALL",
  "subject": "Project Status Check",
  "content": "Discussed project timeline and deliverables...",
  "handledBy": "Sarah Johnson",
  "sentiment": "POSITIVE",
  "keyPoints": ["Project on track", "Budget approved", "Next milestone: April 20"],
  "suggestedAction": "Schedule follow-up in 1 week to discuss next milestone",
  "createdAt": "2026-04-10T11:15:00Z"
}
```

### Get All Interactions
```bash
curl http://localhost:3000/api/interactions
```

### Get Interactions for a Client
```bash
curl http://localhost:3000/api/interactions?clientId=clx123abc
```

---

## 3️⃣ Follow-Ups API

### Schedule a Follow-Up
```bash
curl -X POST http://localhost:3000/api/followups \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "clx123abc",
    "title": "Check on Project Milestone",
    "description": "Follow up on April 20 milestone delivery",
    "scheduledFor": "2026-04-20T10:00:00Z",
    "method": "WHATSAPP",
    "messageTemplate": "Hi {{clientName}}, just checking in on the April 20 milestone. How is everything progressing?"
  }'
```

**Methods:**
- `WHATSAPP` - WhatsApp message
- `SMS` - Text message
- `EMAIL` - Email
- `CALL` - Phone call
- `MEETING` - Schedule meeting

**Response:**
```json
{
  "id": "clx789ghi",
  "clientId": "clx123abc",
  "title": "Check on Project Milestone",
  "description": "Follow up on April 20 milestone delivery",
  "scheduledFor": "2026-04-20T10:00:00Z",
  "status": "PENDING",
  "method": "WHATSAPP",
  "messageTemplate": "Hi {{clientName}}, just checking in...",
  "createdAt": "2026-04-10T11:20:00Z"
}
```

### Get All Follow-Ups
```bash
curl http://localhost:3000/api/followups
```

### Get Pending Follow-Ups
```bash
curl http://localhost:3000/api/followups?status=PENDING
```

### Update Follow-Up Status
```bash
curl -X POST http://localhost:3000/api/followups \
  -H "Content-Type: application/json" \
  -d '{
    "id": "clx789ghi",
    "status": "COMPLETED",
    "completedBy": "Sarah Johnson"
  }'
```

**Status Values:**
- `PENDING` - Scheduled but not yet sent
- `SENT` - Reminder sent to staff
- `COMPLETED` - Follow-up done
- `SKIPPED` - Skipped for a reason

---

## 4️⃣ Complaints API

### Report a Complaint
```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "clx123abc",
    "title": "Delayed Delivery",
    "description": "Product was delivered 3 days late. Client is upset about the delay.",
    "category": "DELIVERY",
    "priority": "HIGH",
    "assignedTo": "John Manager"
  }'
```

**Categories:**
- `PRODUCT` - Product quality issue
- `SERVICE` - Service quality issue
- `DELIVERY` - Delivery/shipping issue
- `BILLING` - Billing/payment issue
- `SUPPORT` - Support/customer service issue
- `OTHER` - Other issue

**Priority Levels:**
- `LOW` - Can wait
- `MEDIUM` - Should be addressed soon
- `HIGH` - Needs attention this week
- `CRITICAL` - Needs immediate action

**Response:**
```json
{
  "id": "clx101jkl",
  "clientId": "clx123abc",
  "title": "Delayed Delivery",
  "description": "Product was delivered 3 days late...",
  "category": "DELIVERY",
  "status": "PENDING",
  "priority": "HIGH",
  "assignedTo": "John Manager",
  "createdAt": "2026-04-10T11:25:00Z",
  "updatedAt": "2026-04-10T11:25:00Z"
}
```

### Get All Complaints
```bash
curl http://localhost:3000/api/complaints
```

### Get Open Complaints
```bash
curl http://localhost:3000/api/complaints?status=PENDING
```

### Update Complaint Status
```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "id": "clx101jkl",
    "status": "RESOLVED",
    "resolutionNotes": "Sent replacement product via expedited shipping. Client satisfied."
  }'
```

**Status Values:**
- `PENDING` - Not yet addressed
- `IN_PROGRESS` - Being worked on
- `RESOLVED` - Issue resolved
- `URGENT` - Needs immediate escalation

---

## 5️⃣ Insights API

### Get AI Insights
```bash
curl http://localhost:3000/api/insights
```

### Get Specific Insight Type
```bash
curl http://localhost:3000/api/insights?type=AT_RISK_CLIENT
```

**Insight Types:**
- `AT_RISK_CLIENT` - Clients at risk of churning
- `FOLLOW_UP_REMINDER` - Pending follow-ups
- `COMPLAINT_ALERT` - New or critical complaints
- `CHURN_PREDICTION` - Churn risk analysis
- `ENGAGEMENT_OPPORTUNITY` - Upsell/expansion opportunities

**Response:**
```json
[
  {
    "id": "clx202mno",
    "clientId": "clx123abc",
    "type": "AT_RISK_CLIENT",
    "title": "John Doe - At Risk",
    "description": "Client has not been contacted in 45 days. Last interaction was negative.",
    "suggestedAction": "Schedule immediate follow-up call to understand concerns",
    "confidence": 85,
    "actedUpon": false,
    "createdAt": "2026-04-10T11:30:00Z"
  }
]
```

---

## 🔄 Common Workflows

### Workflow 1: New Client Onboarding
```bash
# 1. Create client
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "email": "jane@example.com"}'

# 2. Log first interaction
curl -X POST http://localhost:3000/api/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "RETURNED_CLIENT_ID",
    "type": "MEETING",
    "content": "Initial onboarding meeting",
    "sentiment": "POSITIVE"
  }'

# 3. Schedule follow-up
curl -X POST http://localhost:3000/api/followups \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "RETURNED_CLIENT_ID",
    "title": "Onboarding Follow-Up",
    "scheduledFor": "2026-04-17T10:00:00Z",
    "method": "EMAIL"
  }'
```

### Workflow 2: Handle Complaint
```bash
# 1. Report complaint
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "clx123abc",
    "title": "Issue Title",
    "priority": "HIGH"
  }'

# 2. Log interaction about complaint
curl -X POST http://localhost:3000/api/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "clx123abc",
    "type": "CALL",
    "content": "Called client to discuss complaint",
    "sentiment": "NEUTRAL"
  }'

# 3. Update complaint status when resolved
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "id": "COMPLAINT_ID",
    "status": "RESOLVED",
    "resolutionNotes": "Issue resolved"
  }'
```

### Workflow 3: Check At-Risk Clients
```bash
# 1. Get at-risk insights
curl http://localhost:3000/api/insights?type=AT_RISK_CLIENT

# 2. For each at-risk client, schedule follow-up
curl -X POST http://localhost:3000/api/followups \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "AT_RISK_CLIENT_ID",
    "title": "Re-engagement Follow-Up",
    "scheduledFor": "2026-04-11T10:00:00Z",
    "method": "CALL"
  }'

# 3. Log interaction when you reach out
curl -X POST http://localhost:3000/api/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "AT_RISK_CLIENT_ID",
    "type": "CALL",
    "content": "Re-engagement call",
    "sentiment": "POSITIVE"
  }'
```

---

## 🔐 Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad request (invalid data)
- `404` - Not found
- `500` - Server error

**Error Response:**
```json
{
  "error": "Client not found",
  "status": 404
}
```

---

## 📊 Data Types

### Client
```typescript
{
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  healthStatus: "HEALTHY" | "INACTIVE" | "AT_RISK"
  lastInteractionDate?: Date
  nextFollowUpDate?: Date
  notes?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Interaction
```typescript
{
  id: string
  clientId: string
  type: "CALL" | "EMAIL" | "SMS" | "WHATSAPP" | "MEETING" | "NOTE" | "FEEDBACK"
  subject?: string
  content: string
  handledBy: string
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE"
  keyPoints?: string[]
  suggestedAction?: string
  createdAt: Date
}
```

### FollowUp
```typescript
{
  id: string
  clientId: string
  title: string
  description?: string
  scheduledFor: Date
  status: "PENDING" | "SENT" | "COMPLETED" | "SKIPPED"
  method: "WHATSAPP" | "SMS" | "EMAIL" | "CALL" | "MEETING"
  messageTemplate?: string
  completedAt?: Date
  completedBy?: string
  createdAt: Date
  updatedAt: Date
}
```

### Complaint
```typescript
{
  id: string
  clientId: string
  title: string
  description: string
  category: "PRODUCT" | "SERVICE" | "DELIVERY" | "BILLING" | "SUPPORT" | "OTHER"
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "URGENT"
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  assignedTo?: string
  resolutionNotes?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Insight
```typescript
{
  id: string
  clientId: string
  type: "AT_RISK_CLIENT" | "FOLLOW_UP_REMINDER" | "COMPLAINT_ALERT" | "CHURN_PREDICTION" | "ENGAGEMENT_OPPORTUNITY"
  title: string
  description: string
  suggestedAction: string
  confidence: number (0-100)
  actedUpon: boolean
  createdAt: Date
}
```

---

## 🧪 Testing with cURL

### Test Client Creation
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client",
    "email": "test@example.com",
    "phone": "+1234567890",
    "company": "Test Company"
  }' | jq
```

### Test Get All Clients
```bash
curl http://localhost:3000/api/clients | jq
```

### Test with Pretty JSON Output
Add `| jq` to any curl command to pretty-print JSON:
```bash
curl http://localhost:3000/api/clients | jq
```

---

## 🔗 Integration Examples

### Integrate with Zapier
1. Use Zapier's Webhook action
2. POST to `http://localhost:3000/api/clients`
3. Map Zapier fields to API fields
4. Test and activate

### Integrate with Make (formerly Integromat)
1. Create HTTP module
2. Set method to POST
3. Set URL to `http://localhost:3000/api/interactions`
4. Map fields from previous modules
5. Test and run

### Integrate with Custom Script
```javascript
// Node.js example
const fetch = require('node-fetch');

async function createClient(name, email) {
  const response = await fetch('http://localhost:3000/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  });
  return response.json();
}

createClient('John Doe', 'john@example.com')
  .then(client => console.log('Created:', client))
  .catch(err => console.error('Error:', err));
```

---

## 📚 More Examples

See the API route files for more detailed documentation:
- `/app/api/clients/route.ts`
- `/app/api/interactions/route.ts`
- `/app/api/followups/route.ts`
- `/app/api/complaints/route.ts`
- `/app/api/insights/route.ts`

Each file contains detailed comments explaining the API.

---

## 🚀 Ready to Integrate?

You now have everything you need to:
- Create custom workflows
- Integrate with external systems
- Build automation
- Connect to third-party tools

Start with the examples above and adapt them to your needs!
