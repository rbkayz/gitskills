CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION generate_prefixed_id(prefix text)
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT prefix || encode(gen_random_bytes(12), 'hex');
$$;

ALTER TYPE "TrustTier" RENAME TO trust_tier;
ALTER TYPE "ModerationStatus" RENAME TO moderation_status;

ALTER TABLE "Publisher" RENAME TO publisher;
ALTER TABLE "Skill" RENAME TO skill;
ALTER TABLE "Release" RENAME TO release;
ALTER TABLE "DailySkillDownload" RENAME TO daily_skill_download;
ALTER TABLE "ModerationEvent" RENAME TO moderation_event;

ALTER TABLE publisher RENAME CONSTRAINT "Publisher_pkey" TO publisher_pkey;
ALTER TABLE skill RENAME CONSTRAINT "Skill_pkey" TO skill_pkey;
ALTER TABLE release RENAME CONSTRAINT "Release_pkey" TO release_pkey;
ALTER TABLE daily_skill_download RENAME CONSTRAINT "DailySkillDownload_pkey" TO daily_skill_download_pkey;
ALTER TABLE moderation_event RENAME CONSTRAINT "ModerationEvent_pkey" TO moderation_event_pkey;

ALTER TABLE skill RENAME CONSTRAINT "Skill_publisherId_fkey" TO skill_publisher_id_fkey;
ALTER TABLE release RENAME CONSTRAINT "Release_skillId_fkey" TO release_skill_id_fkey;
ALTER TABLE daily_skill_download RENAME CONSTRAINT "DailySkillDownload_skillId_fkey" TO daily_skill_download_skill_id_fkey;
ALTER TABLE moderation_event RENAME CONSTRAINT "ModerationEvent_skillId_fkey" TO moderation_event_skill_id_fkey;
ALTER TABLE moderation_event RENAME CONSTRAINT "ModerationEvent_releaseId_fkey" TO moderation_event_release_id_fkey;

ALTER INDEX "Publisher_handle_key" RENAME TO publisher_handle_key;
ALTER INDEX "Skill_slug_key" RENAME TO skill_slug_key;
ALTER INDEX "Skill_publisherId_idx" RENAME TO skill_publisher_id_idx;
ALTER INDEX "Skill_trusted_trustTier_idx" RENAME TO skill_trusted_trust_tier_idx;
ALTER INDEX "Release_skillId_idx" RENAME TO release_skill_id_idx;
ALTER INDEX "Release_skillId_version_key" RENAME TO release_skill_id_version_key;
ALTER INDEX "Release_status_idx" RENAME TO release_status_idx;
ALTER INDEX "DailySkillDownload_day_idx" RENAME TO daily_skill_download_day_idx;
ALTER INDEX "DailySkillDownload_skillId_idx" RENAME TO daily_skill_download_skill_id_idx;
ALTER INDEX "DailySkillDownload_skillId_day_key" RENAME TO daily_skill_download_skill_id_day_key;
ALTER INDEX "ModerationEvent_createdAt_idx" RENAME TO moderation_event_created_at_idx;
ALTER INDEX "ModerationEvent_skillId_idx" RENAME TO moderation_event_skill_id_idx;
ALTER INDEX "ModerationEvent_releaseId_idx" RENAME TO moderation_event_release_id_idx;

UPDATE publisher
SET id = 'pub_' || id
WHERE id NOT LIKE 'pub_%';

UPDATE skill
SET id = 'skl_' || id
WHERE id NOT LIKE 'skl_%';

UPDATE release
SET id = 'rel_' || id
WHERE id NOT LIKE 'rel_%';

UPDATE daily_skill_download
SET id = 'dsd_' || id
WHERE id NOT LIKE 'dsd_%';

UPDATE moderation_event
SET id = 'mde_' || id
WHERE id NOT LIKE 'mde_%';

ALTER TABLE publisher ALTER COLUMN id SET DEFAULT generate_prefixed_id('pub_');
ALTER TABLE skill ALTER COLUMN id SET DEFAULT generate_prefixed_id('skl_');
ALTER TABLE release ALTER COLUMN id SET DEFAULT generate_prefixed_id('rel_');
ALTER TABLE daily_skill_download ALTER COLUMN id SET DEFAULT generate_prefixed_id('dsd_');
ALTER TABLE moderation_event ALTER COLUMN id SET DEFAULT generate_prefixed_id('mde_');

ALTER TABLE publisher ADD CONSTRAINT publisher_id_prefix_chk CHECK (id LIKE 'pub_%');
ALTER TABLE skill ADD CONSTRAINT skill_id_prefix_chk CHECK (id LIKE 'skl_%');
ALTER TABLE release ADD CONSTRAINT release_id_prefix_chk CHECK (id LIKE 'rel_%');
ALTER TABLE daily_skill_download ADD CONSTRAINT daily_skill_download_id_prefix_chk CHECK (id LIKE 'dsd_%');
ALTER TABLE moderation_event ADD CONSTRAINT moderation_event_id_prefix_chk CHECK (id LIKE 'mde_%');

CREATE INDEX skill_status_download_total_trust_score_idx ON skill (status, download_total DESC, trust_score DESC);
CREATE INDEX skill_status_updated_at_idx ON skill (status, updated_at DESC);
CREATE INDEX release_skill_id_status_created_at_idx ON release (skill_id, status, created_at DESC);
CREATE INDEX moderation_event_skill_id_created_at_idx ON moderation_event (skill_id, created_at DESC);
