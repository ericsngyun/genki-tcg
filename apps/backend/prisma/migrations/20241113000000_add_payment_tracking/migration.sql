-- Add payment tracking to Entry
ALTER TABLE "Entry" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Entry" ADD COLUMN "paidAmount" INTEGER;
ALTER TABLE "Entry" ADD COLUMN "paidBy" TEXT;

-- Add index for payment queries
CREATE INDEX "Entry_eventId_paidAt_idx" ON "Entry"("eventId", "paidAt");
