-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('active', 'hidden', 'blocked');

-- AlterTable
ALTER TABLE "Release" ADD COLUMN     "status" "ModerationStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "status" "ModerationStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "DailySkillDownload" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "DailySkillDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationEvent" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "fromStatus" "ModerationStatus" NOT NULL,
    "toStatus" "ModerationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skillId" TEXT,
    "releaseId" TEXT,

    CONSTRAINT "ModerationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailySkillDownload_day_idx" ON "DailySkillDownload"("day");

-- CreateIndex
CREATE INDEX "DailySkillDownload_skillId_idx" ON "DailySkillDownload"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "DailySkillDownload_skillId_day_key" ON "DailySkillDownload"("skillId", "day");

-- CreateIndex
CREATE INDEX "ModerationEvent_createdAt_idx" ON "ModerationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ModerationEvent_skillId_idx" ON "ModerationEvent"("skillId");

-- CreateIndex
CREATE INDEX "ModerationEvent_releaseId_idx" ON "ModerationEvent"("releaseId");

-- CreateIndex
CREATE INDEX "Release_status_idx" ON "Release"("status");

-- AddForeignKey
ALTER TABLE "DailySkillDownload" ADD CONSTRAINT "DailySkillDownload_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationEvent" ADD CONSTRAINT "ModerationEvent_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationEvent" ADD CONSTRAINT "ModerationEvent_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
