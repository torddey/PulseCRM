-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('INQUIRY', 'OPTIONS_SENT', 'BRIEF_PENDING', 'BRIEF_LOCKED', 'PAYMENT_PENDING', 'PAID', 'CONCEPTS_SENT', 'CONCEPT_APPROVED', 'PRODUCTION', 'READY_TO_DELIVER', 'DELIVERED', 'FOLLOWUP_SENT');

-- CreateEnum
CREATE TYPE "WorkflowActor" AS ENUM ('AGENT', 'HUMAN', 'CLIENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "WorkflowEventType" AS ENUM ('INBOUND_MESSAGE', 'OUTBOUND_MESSAGE', 'STAGE_TRANSITION', 'PAYMENT_CONFIRMED', 'BRIEF_UPDATED', 'PRODUCTION_UPDATE', 'DELIVERY_CONFIRMED', 'FOLLOWUP_TRIGGERED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "ClientWorkflow" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "stage" "WorkflowStage" NOT NULL DEFAULT 'INQUIRY',
    "stageOwner" "WorkflowActor" NOT NULL DEFAULT 'AGENT',
    "stageUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inquiryAt" TIMESTAMP(3),
    "optionsSentAt" TIMESTAMP(3),
    "briefPendingAt" TIMESTAMP(3),
    "briefLockedAt" TIMESTAMP(3),
    "paymentPendingAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "conceptsSentAt" TIMESTAMP(3),
    "conceptApprovedAt" TIMESTAMP(3),
    "productionStartedAt" TIMESTAMP(3),
    "midProductionUpdateAt" TIMESTAMP(3),
    "readyToDeliverAt" TIMESTAMP(3),
    "preDeliveryConfirmedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "followUpSentAt" TIMESTAMP(3),
    "briefUseCase" TEXT,
    "briefStyleReferences" TEXT,
    "briefPreferredColors" TEXT,
    "briefDimensions" TEXT,
    "briefDeadline" TIMESTAMP(3),
    "briefBudget" TEXT,
    "briefDeliveryAddress" TEXT,
    "briefSummary" TEXT,
    "paymentReference" TEXT,
    "conceptSelection" TEXT,
    "productionProgress" INTEGER NOT NULL DEFAULT 0,
    "lastInboundAt" TIMESTAMP(3),
    "nextActionDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEvent" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "eventType" "WorkflowEventType" NOT NULL,
    "fromStage" "WorkflowStage",
    "toStage" "WorkflowStage",
    "actor" "WorkflowActor" NOT NULL DEFAULT 'AGENT',
    "details" TEXT,
    "externalEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowMessageLog" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "templateKey" TEXT,
    "body" TEXT NOT NULL,
    "messageSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientWorkflow_clientId_idx" ON "ClientWorkflow"("clientId");

-- CreateIndex
CREATE INDEX "ClientWorkflow_stage_idx" ON "ClientWorkflow"("stage");

-- CreateIndex
CREATE INDEX "ClientWorkflow_nextActionDueAt_idx" ON "ClientWorkflow"("nextActionDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowEvent_externalEventId_key" ON "WorkflowEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "WorkflowEvent_workflowId_createdAt_idx" ON "WorkflowEvent"("workflowId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowMessageLog_workflowId_createdAt_idx" ON "WorkflowMessageLog"("workflowId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowMessageLog_messageSid_idx" ON "WorkflowMessageLog"("messageSid");

-- AddForeignKey
ALTER TABLE "ClientWorkflow" ADD CONSTRAINT "ClientWorkflow_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ClientWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowMessageLog" ADD CONSTRAINT "WorkflowMessageLog_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ClientWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
