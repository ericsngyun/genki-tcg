-- AlterTable: Add prize distribution fields to Event
ALTER TABLE "Event" ADD COLUMN "totalPrizeCredits" INTEGER DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN "prizesDistributed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "prizesDistributedAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN "prizesDistributedBy" TEXT;
