-- ============================================================================
-- CLIENT MANAGEMENT
-- ============================================================================

-- Health status enum
CREATE TYPE "HealthStatus" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- Client table - Core entity representing a customer/client
CREATE TABLE "Client" (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  company VARCHAR(255),
  "healthStatus" "HealthStatus" NOT NULL DEFAULT 'GREEN',
  "lastInteractionDate" TIMESTAMP,
  "nextFollowUpDate" TIMESTAMP,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Client_healthStatus_idx" ON "Client"("healthStatus");
CREATE INDEX "Client_lastInteractionDate_idx" ON "Client"("lastInteractionDate");
CREATE INDEX "Client_nextFollowUpDate_idx" ON "Client"("nextFollowUpDate");

-- ============================================================================
-- INTERACTION MEMORY
-- ============================================================================

-- Interaction type enum
CREATE TYPE "InteractionType" AS ENUM ('CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'MEETING', 'NOTE', 'FEEDBACK');

-- Sentiment enum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- Interaction table - Complete history of all client communications
CREATE TABLE "Interaction" (
  id TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  type "InteractionType" NOT NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  "handledBy" VARCHAR(255) NOT NULL,
  sentiment "Sentiment" NOT NULL DEFAULT 'NEUTRAL',
  "keyPoints" TEXT[] DEFAULT '{}',
  "suggestedAction" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Interaction_clientId_idx" ON "Interaction"("clientId");
CREATE INDEX "Interaction_type_idx" ON "Interaction"(type);
CREATE INDEX "Interaction_sentiment_idx" ON "Interaction"(sentiment);

-- ============================================================================
-- COMPLAINT TRACKING
-- ============================================================================

-- Complaint category enum
CREATE TYPE "ComplaintCategory" AS ENUM ('PRODUCT_QUALITY', 'SERVICE_DELIVERY', 'BILLING', 'SUPPORT', 'DELIVERY', 'OTHER');

-- Complaint status enum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'URGENT');

-- Priority enum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Complaint table - Logs every issue and tracks resolution
CREATE TABLE "Complaint" (
  id TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category "ComplaintCategory" NOT NULL,
  status "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
  priority "Priority" NOT NULL DEFAULT 'MEDIUM',
  "assignedTo" VARCHAR(255),
  "resolutionNotes" TEXT,
  "resolvedAt" TIMESTAMP,
  "lastReminderSent" TIMESTAMP,
  "reminderCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Complaint_clientId_idx" ON "Complaint"("clientId");
CREATE INDEX "Complaint_status_idx" ON "Complaint"(status);
CREATE INDEX "Complaint_priority_idx" ON "Complaint"(priority);
CREATE INDEX "Complaint_assignedTo_idx" ON "Complaint"("assignedTo");

-- ============================================================================
-- SMART FOLLOW-UP ENGINE
-- ============================================================================

-- Follow-up status enum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'SENT', 'COMPLETED', 'SKIPPED');

-- Communication method enum
CREATE TYPE "CommunicationMethod" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'CALL', 'IN_PERSON');

-- FollowUp table - Automatically reminds staff to check on clients
CREATE TABLE "FollowUp" (
  id TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "scheduledFor" TIMESTAMP NOT NULL,
  status "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
  method "CommunicationMethod" NOT NULL DEFAULT 'EMAIL',
  "messageTemplate" TEXT,
  "completedAt" TIMESTAMP,
  "completedBy" VARCHAR(255),
  "reminderSentAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "FollowUp_clientId_idx" ON "FollowUp"("clientId");
CREATE INDEX "FollowUp_scheduledFor_idx" ON "FollowUp"("scheduledFor");
CREATE INDEX "FollowUp_status_idx" ON "FollowUp"(status);

-- ============================================================================
-- AI ASSISTANT & SUGGESTIONS
-- ============================================================================

-- Insight type enum
CREATE TYPE "InsightType" AS ENUM ('AT_RISK_CLIENT', 'FOLLOW_UP_REMINDER', 'SUGGESTED_MESSAGE', 'COMPLAINT_ALERT', 'ENGAGEMENT_OPPORTUNITY', 'CHURN_PREDICTION');

-- AIInsight table - AI-generated suggestions for staff
CREATE TABLE "AIInsight" (
  id TEXT PRIMARY KEY,
  "clientId" TEXT,
  type "InsightType" NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  "suggestedAction" TEXT,
  confidence INTEGER NOT NULL DEFAULT 75,
  "actedUpon" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AIInsight_type_idx" ON "AIInsight"(type);
CREATE INDEX "AIInsight_actedUpon_idx" ON "AIInsight"("actedUpon");

-- ============================================================================
-- DASHBOARD & ANALYTICS
-- ============================================================================

-- ClientMetric table - Tracks metrics for dashboard visualization
CREATE TABLE "ClientMetric" (
  id TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL UNIQUE REFERENCES "Client"(id) ON DELETE CASCADE,
  "totalInteractions" INTEGER NOT NULL DEFAULT 0,
  "lastInteractionDays" INTEGER,
  "openComplaints" INTEGER NOT NULL DEFAULT 0,
  "resolvedComplaints" INTEGER NOT NULL DEFAULT 0,
  "pendingFollowUps" INTEGER NOT NULL DEFAULT 0,
  "completedFollowUps" INTEGER NOT NULL DEFAULT 0,
  "healthScore" INTEGER NOT NULL DEFAULT 75,
  "churnRisk" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ClientMetric_healthScore_idx" ON "ClientMetric"("healthScore");
CREATE INDEX "ClientMetric_churnRisk_idx" ON "ClientMetric"("churnRisk");

-- ============================================================================
-- STAFF & TEAM MANAGEMENT
-- ============================================================================

-- TeamMember table - Tracks staff and their responsibilities
CREATE TABLE "TeamMember" (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AUTOMATION & SCHEDULING
-- ============================================================================

-- AutomationRule table - Defines rules for automated actions
CREATE TABLE "AutomationRule" (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
