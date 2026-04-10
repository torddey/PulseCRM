# 🚀 Proactive AI Relationship Manager CRM

**Never lose a client silently again.** AI-powered client engagement & relationship management system with WhatsApp integration and Google OAuth authentication.

## ✨ Features

### 🔐 Authentication
- **Google OAuth Sign-In** - Secure authentication via Google
- **Session Management** - JWT + Database-backed sessions
- **Protected Routes** - Middleware-based route protection
- **User Profiles** - User data stored in PostgreSQL

### 📊 Dashboard
- **Client Health Dashboard** - Real-time status (Green/Yellow/Red)
- **Metrics Overview** - Total clients, healthy, at-risk, follow-ups, complaints
- **Quick Actions** - Add client, log interaction, schedule follow-up, report complaint
- **AI Insights** - Smart suggestions for client engagement

### 💬 WhatsApp Integration
- **Automated Messages** - Send WhatsApp messages to clients
- **Message Templates** - Pre-built templates for common scenarios
- **Delivery Tracking** - Track message delivery status
- **Two-Way Communication** - Receive and respond to messages

### 🔁 Smart Follow-Up Engine
- **Automatic Reminders** - Reminds staff to check on clients
- **Scheduled Follow-Ups** - Plan follow-ups in advance
- **WhatsApp/SMS Delivery** - Automated message delivery
- **Status Tracking** - Track follow-up completion

### 📂 Complaint Tracker
- **Issue Logging** - Log every client complaint
- **Status Tracking** - Pending, In Progress, Resolved, Urgent
- **Reminder System** - Sends reminders until resolved
- **Resolution Notes** - Document how issues were resolved

### 🧠 AI Assistant
- **Smart Suggestions** - AI suggests what to say to clients
- **Risk Detection** - Identifies clients at risk of churn
- **Engagement Opportunities** - Suggests when to reach out
- **Sentiment Analysis** - Analyzes interaction tone

### 📞 Interaction Memory
- **Complete History** - All calls, emails, SMS, WhatsApp, meetings
- **Sentiment Analysis** - Positive, neutral, or negative
- **Key Points** - Extracts important information from interactions
- **Suggested Actions** - AI recommends next steps

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **API Integration**: WhatsApp Business API

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Google OAuth credentials
- WhatsApp Business API credentials (optional)

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/torddey/PulseCRM.git
   cd PulseCRM
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create database**:
   ```bash
   createdb -h localhost -U $PGUSER crm_db
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

5. **Run migrations**:
   ```bash
   export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@localhost:5432/crm_db"
   npx prisma migrate dev --name add_auth_tables
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

7. **Open in browser**:
   ```
   http://localhost:3000
   ```

## 🔐 Environment Variables

Create `.env.local` with the following:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Proactive AI Relationship Manager"

# WhatsApp (optional)
WHATSAPP_BUSINESS_ACCOUNT_ID="your_account_id"
WHATSAPP_BUSINESS_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_BUSINESS_API_TOKEN="your_api_token"
```

## 📚 Documentation

- **[GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)** - Complete Google OAuth setup guide
- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Feature overview and technical details
- **[COMPLETION_REPORT.md](./COMPLETION_REPORT.md)** - Project completion status and checklist
- **[WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md)** - WhatsApp integration guide

## 🚀 Quick Start

### Sign In
1. Visit `http://localhost:3000`
2. Click "Sign in with Google"
3. Authenticate with your Google account
4. You'll be redirected to the dashboard

### Add a Client
1. Click "Add New Client" in Quick Actions
2. Fill in client details (name, email, phone, company)
3. Click "Create Client"
4. Client appears in dashboard

### Log Interaction
1. Click "Log Interaction" in Quick Actions
2. Select client and interaction type
3. Add notes and sentiment
4. Click "Save Interaction"

### Schedule Follow-Up
1. Click "Schedule Follow-Up" in Quick Actions
2. Select client and follow-up date
3. Choose communication method (Email, SMS, WhatsApp, Call)
4. Add message template
5. Click "Schedule"

### Report Complaint
1. Click "Report Complaint" in Quick Actions
2. Select client and complaint category
3. Add description and priority
4. Click "Report Complaint"

## 🔧 API Routes

### Authentication
- `GET /api/auth/signin` - Sign in page
- `POST /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/[id]` - Get client details
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Interactions
- `GET /api/interactions` - List interactions
- `POST /api/interactions` - Create interaction
- `GET /api/interactions/[id]` - Get interaction details

### Complaints
- `GET /api/complaints` - List complaints
- `POST /api/complaints` - Create complaint
- `PUT /api/complaints/[id]` - Update complaint status

### Follow-Ups
- `GET /api/follow-ups` - List follow-ups
- `POST /api/follow-ups` - Schedule follow-up
- `PUT /api/follow-ups/[id]` - Update follow-up status

### WhatsApp
- `POST /api/whatsapp/send` - Send WhatsApp message
- `POST /api/whatsapp/webhook` - Receive WhatsApp messages

## 📊 Database Schema

### User
- `id` - Unique identifier
- `email` - User email (unique)
- `name` - User name
- `image` - Profile image URL
- `role` - User role (USER, ADMIN)
- `isActive` - Account status
- `createdAt` - Account creation date
- `updatedAt` - Last update date

### Client
- `id` - Unique identifier
- `name` - Client name
- `email` - Client email (unique)
- `phone` - Client phone number
- `company` - Client company
- `healthStatus` - GREEN, YELLOW, or RED
- `lastInteractionDate` - Last contact date
- `nextFollowUpDate` - Scheduled follow-up date
- `notes` - Client notes
- `tags` - Client tags/categories
- `createdAt` - Record creation date
- `updatedAt` - Last update date

### Interaction
- `id` - Unique identifier
- `clientId` - Associated client
- `type` - CALL, EMAIL, SMS, WHATSAPP, MEETING, NOTE, FEEDBACK
- `subject` - Interaction subject
- `content` - Interaction details
- `handledBy` - Staff member name
- `sentiment` - POSITIVE, NEUTRAL, NEGATIVE
- `keyPoints` - Important takeaways
- `suggestedAction` - AI-suggested next action
- `createdAt` - Interaction date

### Complaint
- `id` - Unique identifier
- `clientId` - Associated client
- `title` - Complaint title
- `description` - Complaint details
- `category` - PRODUCT_QUALITY, SERVICE_DELIVERY, BILLING, SUPPORT, DELIVERY, OTHER
- `status` - PENDING, IN_PROGRESS, RESOLVED, URGENT
- `priority` - LOW, MEDIUM, HIGH, CRITICAL
- `assignedTo` - Assigned staff member
- `resolutionNotes` - How it was resolved
- `resolvedAt` - Resolution date
- `lastReminderSent` - Last reminder date
- `reminderCount` - Number of reminders sent
- `createdAt` - Report date
- `updatedAt` - Last update date

### FollowUp
- `id` - Unique identifier
- `clientId` - Associated client
- `title` - Follow-up title
- `description` - Follow-up details
- `scheduledFor` - Scheduled date/time
- `status` - PENDING, SENT, COMPLETED, SKIPPED
- `method` - EMAIL, SMS, WHATSAPP, CALL, IN_PERSON
- `messageTemplate` - Message to send
- `completedAt` - Completion date
- `completedBy` - Staff member who completed it
- `reminderSentAt` - Reminder sent date
- `createdAt` - Creation date
- `updatedAt` - Last update date

## 🔐 Security

### Implemented
- ✅ Google OAuth authentication
- ✅ Secure session tokens (JWT + Database)
- ✅ CSRF protection
- ✅ Environment variable protection
- ✅ Secure password hashing (bcrypt)
- ✅ Database-backed sessions
- ✅ Automatic token refresh
- ✅ Secure cookie configuration

### Best Practices
- Use strong `NEXTAUTH_SECRET` (32+ characters)
- Enable HTTPS in production
- Regularly rotate API credentials
- Monitor authentication logs
- Implement rate limiting
- Use secure database backups

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
1. Set environment variables
2. Run migrations: `npx prisma migrate deploy`
3. Build: `npm run build`
4. Start: `npm start`

## 📞 Support

### Documentation
- [Google OAuth Setup](./GOOGLE_AUTH_SETUP.md)
- [Integration Summary](./INTEGRATION_SUMMARY.md)
- [Completion Report](./COMPLETION_REPORT.md)
- [WhatsApp Integration](./WHATSAPP_INTEGRATION.md)

### Resources
- [NextAuth.js Documentation](https://authjs.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 📝 License

This project is proprietary and confidential.

## 👤 Author

Evans Torddey (ea.torddey@gmail.com)

## 🎯 Roadmap

### Phase 1 (Complete ✅)
- [x] Google OAuth authentication
- [x] WhatsApp integration
- [x] Client management
- [x] Interaction tracking
- [x] Complaint management
- [x] Follow-up scheduling

### Phase 2 (Planned)
- [ ] Email integration
- [ ] SMS integration
- [ ] Advanced analytics
- [ ] Custom reports
- [ ] Team collaboration
- [ ] Mobile app

### Phase 3 (Future)
- [ ] AI chatbot
- [ ] Predictive analytics
- [ ] Multi-language support
- [ ] Advanced automation
- [ ] API marketplace

## 🤝 Contributing

This is a proprietary project. For contributions or issues, contact the author.

---

**Status**: ✅ **Production Ready**

**Last Updated**: April 10, 2026

**Version**: 1.0.0

**Repository**: https://github.com/torddey/PulseCRM.git
