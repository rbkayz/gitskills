-- Rename columns to snake_case
ALTER TABLE "Publisher" RENAME COLUMN "displayName" TO display_name;
ALTER TABLE "Publisher" RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE "Skill" RENAME COLUMN "readmeMd" TO readme_md;
ALTER TABLE "Skill" RENAME COLUMN "licenseSpdx" TO license_spdx;
ALTER TABLE "Skill" RENAME COLUMN "homepageUrl" TO homepage_url;
ALTER TABLE "Skill" RENAME COLUMN "repoUrl" TO repo_url;
ALTER TABLE "Skill" RENAME COLUMN "downloadTotal" TO download_total;
ALTER TABLE "Skill" RENAME COLUMN "trustScore" TO trust_score;
ALTER TABLE "Skill" RENAME COLUMN "trustBreakdownJson" TO trust_breakdown_json;
ALTER TABLE "Skill" RENAME COLUMN "trustTier" TO trust_tier;
ALTER TABLE "Skill" RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE "Skill" RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE "Skill" RENAME COLUMN "publisherId" TO publisher_id;

ALTER TABLE "Release" RENAME COLUMN "tarballUrl" TO tarball_url;
ALTER TABLE "Release" RENAME COLUMN "sizeBytes" TO size_bytes;
ALTER TABLE "Release" RENAME COLUMN "downloadTotal" TO download_total;
ALTER TABLE "Release" RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE "Release" RENAME COLUMN "skillId" TO skill_id;

ALTER TABLE "DailySkillDownload" RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE "DailySkillDownload" RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE "DailySkillDownload" RENAME COLUMN "skillId" TO skill_id;

ALTER TABLE "ModerationEvent" RENAME COLUMN "fromStatus" TO from_status;
ALTER TABLE "ModerationEvent" RENAME COLUMN "toStatus" TO to_status;
ALTER TABLE "ModerationEvent" RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE "ModerationEvent" RENAME COLUMN "skillId" TO skill_id;
ALTER TABLE "ModerationEvent" RENAME COLUMN "releaseId" TO release_id;

-- Enable row-level security on all app tables
ALTER TABLE "Publisher" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Release" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailySkillDownload" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModerationEvent" ENABLE ROW LEVEL SECURITY;

-- Public read policies for registry data
CREATE POLICY "publisher_select_public"
  ON "Publisher"
  FOR SELECT
  USING (true);

CREATE POLICY "skill_select_public_active"
  ON "Skill"
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "release_select_public_active"
  ON "Release"
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "daily_skill_download_select_public"
  ON "DailySkillDownload"
  FOR SELECT
  USING (true);

-- Moderation events remain restricted to service/admin access.

-- Service/admin write policies for operational endpoints
CREATE POLICY "publisher_service_write"
  ON "Publisher"
  FOR ALL
  USING (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  )
  WITH CHECK (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

CREATE POLICY "skill_service_write"
  ON "Skill"
  FOR ALL
  USING (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  )
  WITH CHECK (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

CREATE POLICY "release_service_write"
  ON "Release"
  FOR ALL
  USING (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  )
  WITH CHECK (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

CREATE POLICY "daily_skill_download_service_write"
  ON "DailySkillDownload"
  FOR ALL
  USING (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  )
  WITH CHECK (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

CREATE POLICY "moderation_event_service_only"
  ON "ModerationEvent"
  FOR ALL
  USING (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  )
  WITH CHECK (
    current_user IN ('postgres', 'service_role')
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );
