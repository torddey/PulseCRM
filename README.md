# 🚀 Proactive AI Relationship Manager

**Never lose a client silently again.** AI-powered CRM system that solves all your client management problems.

## 🎯 What This Solves

### Problems Identified:
- ❌ Clients feel ignored after purchase
- ❌ Follow-ups are inconsistent
- ❌ Complaints are not tracked properly
- ❌ Client service officer is overwhelmed manually

### Solutions Provided:

#### 1. 🔁 Smart Follow-Up Engine
- Automatically reminds staff: "Check on Client A today"
- Sends WhatsApp/SMS follow-ups automatically
- Ensures consistent, timely engagement
- Never miss a follow-up again

#### 2. 📂 Complaint Tracker (Zero Chaos)
- Logs every issue
- Assigns status: Pending / Resolved / Urgent
- Sends reminders until resolved
- Nothing falls through the cracks

#### 3. 🧠 AI Assistant (Your Secret Weapon)
- Suggests what to say
- When to follow up
- Which clients are at risk
- Predicts churn before it happens

#### 4. 📊 Client Health Dashboard
- **Green** → Happy, engaged clients
- **Yellow** → Inactive, needs attention
- **Red** → At risk of churn, urgent action
- Never lose a client silently again

#### 5. 📞 Interaction Memory
- Stores: Calls, Messages, Complaints, Meetings
- Complete communication history
- No more: "Wait… what did this client say again?"
- Sentiment analysis on every interaction

## 🏗️ Architecture

### Database Schema

The system uses PostgreSQL with the following core entities:

**Client Management:**
- `Client` - Core client information with health status
- `ClientMetric` - Tracks engagement and churn risk metrics

**Communication:**
- `Interaction` - Complete history of all communications
- `FollowUp` - Scheduled follow-ups with automation
- `Complaint` - Issue tracking with resolution workflow

**AI & Automation:**
- `AIInsight` - AI-generated suggestions and alerts
- `AutomationRule` - Rules for automated actions
- `TeamMember` - Staff management

### API Endpoints

#### Clients
- `GET /api/clients` - Fetch all clients with filters
- `POST /api/clients` - Create new client

#### Follow-Ups
- `GET /api/followups` - Fetch pending follow-ups
- `POST /api/followups` - Schedule new follow-up

#### Complaints
- `GET /api/complaints` - Fetch complaints with filters
- `POST /api/complaints` - Report new complaint

#### Interactions
- `GET /api/interactions` - Fetch interaction history
- `POST /api/interactions` - Log new interaction

#### AI Insights
- `GET /api/insights` - Fetch AI suggestions
- `POST /api/insights` - Mark insight as acted upon

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or bun

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
# Copy the example file
cp .env.example .env.local

# Update with your database credentials
DATABASE_URL="postgresql://user:password@localhost:5432/crm_relationship_manager"
```

3. **Database is already set up** with schema in `schema.sql`

4. **Start the development server:**
```bash
npm run dev
```

5. **Open in browser:**
```
http://localhost:3000
```

## 📊 Dashboard Features

### Overview Tab
- Real-time client health status
- Key metrics at a glance
- Quick action buttons

### Follow-Ups Tab
- Pending follow-ups sorted by date
- Communication method selection
- Automated message templates

### Complaints Tab
- Open complaints with priority levels
- Assignment tracking
- Resolution workflow

### AI Insights Tab
- At-risk client alerts
- Suggested follow-up actions
- Churn predictions
- Engagement opportunities

### Interactions Tab
- Complete communication history
- Sentiment analysis
- Key points extraction
- Suggested next actions

## 🔌 API Usage Examples

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

### Schedule a Follow-Up
```bash
curl -X POST http://localhost:3000/api/followups \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-id-here",
    "title": "Check in on project status",
    "scheduledFor": "2026-04-15T10:00:00Z",
    "method": "WHATSAPP"
  }'
```

### Log an Interaction
```bash
curl -X POST http://localhost:3000/api/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-id-here",
    "type": "CALL",
    "content": "Discussed project requirements and timeline",
    "handledBy": "John Smith",
    "sentiment": "POSITIVE",
    "keyPoints": ["Approved budget", "Timeline confirmed"]
  }'
```

### Report a Complaint
```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-id-here",
    "title": "Delayed delivery",
    "description": "Product was delivered 3 days late",
    "category": "DELIVERY",
    "priority": "HIGH"
  }'
```

## 🤖 AI Features

### Automatic Insights Generated For:

1. **At-Risk Clients**
   - Triggered by: Negative interactions, overdue follow-ups, open complaints
   - Action: Immediate outreach recommended

2. **Follow-Up Reminders**
   - Triggered by: Scheduled follow-up dates
   - Action: Staff notification with suggested message

3. **Complaint Alerts**
   - Triggered by: New complaints, especially critical ones
   - Action: Immediate escalation and resolution tracking

4. **Churn Predictions**
   - Triggered by: Pattern analysis of interactions and engagement
   - Action: Proactive retention strategies

5. **Engagement Opportunities**
   - Triggered by: Positive interactions, long-term clients
   - Action: Upsell or expansion opportunities

## 📈 Metrics & Analytics

### Client Health Score (0-100)
- Based on: Interaction frequency, sentiment, complaint resolution
- Updated: After each interaction or complaint

### Churn Risk (0-100)
- Based on: Days since last interaction, open complaints, negative sentiment
- Updated: Daily

### Engagement Metrics
- Total interactions
- Last interaction date
- Pending follow-ups
- Open complaints

## 🔐 Security

- Database credentials stored in environment variables
- API routes validate all inputs
- Cascade delete prevents orphaned records
- Timestamps track all changes

## 📝 Database Schema Details

### Client Health Status
- **GREEN**: Happy, engaged client (recent positive interactions)
- **YELLOW**: Inactive client (no interaction in 30+ days)
- **RED**: At-risk client (negative sentiment, open complaints, overdue follow-ups)

### Interaction Types
- CALL - Phone conversation
- EMAIL - Email communication
- SMS - Text message
- WHATSAPP - WhatsApp message
- MEETING - In-person or video meeting
- NOTE - Internal note
- FEEDBACK - Customer feedback

### Complaint Categories
- PRODUCT_QUALITY - Product defects or quality issues
- SERVICE_DELIVERY - Service not meeting expectations
- BILLING - Billing or payment issues
- SUPPORT - Support quality issues
- DELIVERY - Delivery or logistics issues
- OTHER - Other issues

### Complaint Priority
- LOW - Can be addressed within 2 weeks
- MEDIUM - Should be addressed within 1 week
- HIGH - Should be addressed within 2-3 days
- CRITICAL - Immediate action required

## 🚀 Deployment

### Deploy to Vercel
```bash
vercel deploy
```

### Environment Variables for Production
```
DATABASE_URL=postgresql://...
NODE_ENV=production
```

## 📚 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: Next.js API Routes

## 🤝 Contributing

This is a complete CRM system ready for production use. Customize as needed for your business.

## 📞 Support

For issues or questions, refer to the API documentation in each route file.

---

**Built with ❤️ for better client relationships**
