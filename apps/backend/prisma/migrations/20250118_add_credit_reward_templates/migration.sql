-- CreateTable
CREATE TABLE "CreditRewardTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "reasonCode" "CreditReasonCode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditRewardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditRewardTemplate_orgId_idx" ON "CreditRewardTemplate"("orgId");

-- CreateIndex
CREATE INDEX "CreditRewardTemplate_createdBy_idx" ON "CreditRewardTemplate"("createdBy");

-- AddForeignKey
ALTER TABLE "CreditRewardTemplate" ADD CONSTRAINT "CreditRewardTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditRewardTemplate" ADD CONSTRAINT "CreditRewardTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
