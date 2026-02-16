-- CreateEnum
CREATE TYPE "TrustTier" AS ENUM ('community', 'bronze', 'silver', 'gold');

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "trustTier" "TrustTier",
ADD COLUMN     "trusted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Skill_trusted_trustTier_idx" ON "Skill"("trusted", "trustTier");
