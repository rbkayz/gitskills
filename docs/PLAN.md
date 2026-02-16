# Build And Deploy Plan

## Product Goals

1. **Discovery**: users and agents can find skills by category, tags, keyword search, and natural language queries.
2. **Installation**: agents (and humans) can install exactly one skill (and its assets/scripts) via CLI.
3. **Trust**: every skill and release has a transparent trust profile and a computed trust score.
4. **Open-source friendly**: everything needed to run a public registry is in-repo: infra, moderation tools, and docs.

## Primary Users And Workflows

- **Humans**
  - Browse skills, sort by downloads/trust/updated
  - Inspect skill docs, changelogs, versions
  - Copy install commands
- **Agents**
  - Read skill pages in **Markdown** (no HTML parsing required)
  - Search skills in natural language and receive structured results via **MCP**
  - Install a single skill via CLI (pin version; verify integrity)
- **Publishers**
  - Publish new skills and versions
  - Prove ownership and optionally sign releases

## MVP Definition (First Publicly Useful Version)

### Registry

- Skill metadata + versions
- Upload/download of skill release tarballs
- Download counting
- Basic trust score (static rules, transparent breakdown)
- Search:
  - Keyword search (name/description/tags)
  - Filters: category, compatibility, license, minimum trust, publisher
  - Sort: downloads, trust, recently updated

### Web (Human UI)

- Home: featured + trending + recent
- Search page with filters/sorts
- Skill page with:
  - README render (HTML)
  - Versions table
  - Trust breakdown
  - “Install” command copy

### Markdown (Agent UI)

- Every skill page has a Markdown representation:
  - `GET /skills/<slug>/README.md`
  - `GET /md/skills/<slug>.md` (full skill card: metadata + trust + versions + install)
- Search results in Markdown:
  - `GET /md/search.md?q=...&filters...`
- A stable, discoverable “index”:
  - `GET /.well-known/gitskills/index.md`

### MCP

Expose tools/resources that map cleanly to agent actions:

- `search_skills(query, filters)` -> list of skills (slug, name, summary, trust, downloads, install_hint)
- `get_skill(slug)` -> full metadata + README markdown + versions
- `get_skill_readme(slug)` -> markdown
- `get_install_command(slug, version?)` -> deterministic CLI command string

### CLI

Commands (minimal set):

- `gitskills search "<query>" [--tag t] [--category c] [--min-trust n] [--sort downloads|trust|recent]`
- `gitskills info <slug>`
- `gitskills install <slug> [--version v] [--dir path]`
- `gitskills registry set <url>` and `gitskills registry get`

Install behavior (MVP):

- Download tarball for selected version
- Verify `sha256` from registry
- Extract into `<dir>/<slug>/...` (default dir: `$CODEX_HOME/skills` if set, else `./skills`)
- Refuse overwriting unless `--force`

## Data Model (MVP)

- `Publisher`
  - `id`, `handle`, `displayName`, `createdAt`
- `Skill`
  - `id`, `slug`, `name`, `summary`, `readmeMd`, `categories[]`, `tags[]`, `compatibility[]`
  - `licenseSpdx`, `homepageUrl`, `repoUrl`
  - `publisherId`
  - `downloadTotal`, `trustScore`, `trustBreakdownJson`
  - `createdAt`, `updatedAt`
- `Release`
  - `id`, `skillId`, `version`, `tarballUrl`
  - `sha256`, `sizeBytes`
  - `downloadTotal`, `createdAt`

## Trust Score (MVP)

Rule-based, transparent, and conservative. Example components:

- +10 has SPDX license
- +10 has repository URL
- +10 has homepage URL
- +10 release includes `SKILL.md` at root
- +10 includes `LICENSE` file in tarball
- +20 publisher is “verified” (manual/admin in MVP)
- +30 release is signed (deferred to v1 unless quick)

Store:

- `trustScore` as number (0-100)
- `trustBreakdownJson` as the evidence and points

## Architecture

### Services

1. **Web + API** (`apps/web`)
  - Next.js app router
  - API routes for registry operations
  - Markdown endpoints alongside HTML pages
2. **MCP server** (`apps/mcp`)
  - Lightweight Node server using MCP SDK
  - Calls registry API and returns structured responses
3. **CLI** (`packages/cli`)
  - Calls registry API
  - Downloads and installs tarballs

### Storage

- **Database**: Postgres (local via Docker; prod via Neon/Supabase/RDS)
- **Tarballs**: S3-compatible object storage (local via MinIO; prod via R2/S3)
- Optional later: CDN for tarballs

### Search

MVP: Postgres full-text + trigram.
Later: dedicated search (Meilisearch/Typesense) or embeddings (pgvector).

## Deployment Plan

### Local Dev

- `docker compose up` for Postgres + MinIO
- `npm install`
- `npm run dev` (runs all workspaces)

### Production (Pragmatic Defaults)

- **Web/API**: Fly.io or Render (Docker deploy)
- **DB**: Neon or Supabase Postgres
- **Object storage**: Cloudflare R2 (or AWS S3)
- **MCP server**: Fly.io/Render (small service)
- **CLI**: npm package publish (or GitHub releases)

## Security + Moderation (Minimum Necessary)

- Rate limit anonymous endpoints (download/search)
- Validate published packages:
  - size limits
  - path traversal protection on extract
  - enforce required files (`SKILL.md`)
  - compute and store `sha256`
- Namespace protection:
  - reserve critical names (`codex`, `openai`, etc.)
  - publisher ownership checks (v1)
- Takedown/flagging:
  - admin tool to hide skill/release

## Milestones

### M0: Repo Foundations (today)

- Monorepo + TypeScript baseline
- Docker Compose for Postgres + MinIO
- Skeleton for web/api, mcp, cli
- Docs + spec locked

### M1: Read-Only Registry + Web + Markdown

- DB schema + migrations
- Seed script with sample skills
- Web browse/search + detail pages
- Markdown endpoints for index/search/skill cards

### M2: CLI Install (no publishing yet)

- `search`, `info`, `install`
- integrity verification and safe extraction

### M3: MCP Discovery

- MCP server exposing `search_skills`, `get_skill`, `get_skill_readme`
- Agent-friendly results tuned for tool use

### M4: Publishing (v1)

- `publish` CLI: pack directory -> tarball + metadata
- Auth (token) + ownership checks
- Versioning rules and “latest” resolution

### M5: Trust + Verification (v1.1+)

- Signing support (Sigstore/cosign)
- Automated scanning pipeline (malware, SBOM)
- Trust score becomes harder to game

## “Let’s Go” Implementation Order

1. Scaffold workspace packages and shared types
2. Add docker compose (Postgres + MinIO)
3. Add Prisma schema + migrations
4. Implement API endpoints + Markdown endpoints
5. Build Web UI on top of API
6. Implement CLI search/info/install
7. Implement MCP server wrapping the API

