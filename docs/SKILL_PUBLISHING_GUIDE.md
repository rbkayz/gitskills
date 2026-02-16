# Skill Publishing Guide

This guide defines how skills are added to the repository and promoted into the registry.

## 1. Create a Skill Entry

1. Copy templates:
   - `skills/templates/skill.template.yaml` -> `skills/registry/<slug>/skill.yaml`
   - `skills/templates/SKILL.md` -> `skills/registry/<slug>/SKILL.md`
2. Set `<slug>` to lowercase kebab-case and keep folder name equal to `slug`.
3. Fill required metadata:
   - identity: `slug`, `name`, `summary`
   - ownership: `publisher.handle`, `publisher.verified`
   - provenance: `repo_url`, `source.*`
   - compatibility and tags

## 2. Trust Inputs

`skill.yaml` includes `trust_inputs` used by CI:

- `has_skill_md`
- `has_license_file`
- `signed_release`

The score is computed from fixed rules in `scripts/skills/review-trust.mjs`.

## 3. Refresh Computed Trust Fields

Run:

```bash
npm run skills:trust
```

This updates:

- `computed.trust_score`
- `computed.trust_tier`
- `computed.trusted`
- `computed.breakdown`
- `computed.reviewed_at`

## 4. Open a PR

PRs touching `skills/**` trigger the `Skills Trust Gate` workflow.

The gate fails when:

- manifest schema is invalid
- required files/fields are missing
- `computed` trust fields are outdated
- trust score is below `review.min_trust_required`

## 5. Merge Requirements

Recommended branch protection:

1. Require status checks:
   - `Skills Trust Gate / trust-review`
   - `CI / validate`
2. Require pull request review approvals.
3. Require review from code owners.

`CODEOWNERS` is configured for `skills/**`.

## 6. Publish to Registry

After merge, publish via CLI or API flow:

```bash
gitskills publish <skill-dir> --slug <slug> --version <semver> --publisher <handle> ...
```

For session-backed publishing, sign in and ensure publisher membership is configured.
