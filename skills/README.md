# Skills Repository

This folder is the repository-backed source of truth for curated skill entries.

## Layout

- `skills/templates/`: starter templates for contributors.
- `skills/registry/<slug>/skill.yaml`: manifest metadata and computed trust fields.
- `skills/registry/<slug>/SKILL.md`: human/agent-readable skill description for the entry.
- `skills/SOURCES.md`: curated upstream source list.

## Trust Workflow

1. Add or update `skills/registry/<slug>/skill.yaml` and `SKILL.md`.
2. Run `npm run skills:trust` to refresh computed trust fields.
3. Open a PR.
4. CI runs `skills-trust-gate` and blocks merge on validation/trust failures.

## Rules

- Slug must match folder name.
- `schema_version` is currently `1`.
- `publisher.verified` must be explicit (`true` or `false`).
- `computed` is machine-maintained by the trust review script.
