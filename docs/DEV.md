# Local Development

## Prereqs

- Node.js (tested with Node 22)
- Docker Desktop

## Start Infra

```bash
docker compose up -d
```

## Migrate + Seed DB

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://gitskills:gitskills@localhost:5432/gitskills"

npm run db:migrate
npm run db:seed
```

## Run Web (Registry + UI)

```bash
npm run dev:web
```

Optional for GitHub login:

```bash
$env:AUTH_SECRET="replace-me-with-random-string"
$env:GITHUB_CLIENT_ID="..."
$env:GITHUB_CLIENT_SECRET="..."
```

Optional for embedding-backed hybrid search:

```bash
$env:OPENAI_API_KEY="..."
$env:OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

Useful URLs (assuming `-p 3001`):

- `http://localhost:3001/`
- `http://localhost:3001/docs/setup`
- `http://localhost:3001/api/skills?q=hello`
- `http://localhost:3001/md/search.md?q=hello`
- `http://localhost:3001/md/trending.md?days=7`
- `http://localhost:3001/md/trusted.md`
- `http://localhost:3001/.well-known/gitskills/index.md`
- `http://localhost:3001/md/skills/hello-world.md`
- `http://localhost:3001/skills/hello-world/README.md`
- `http://localhost:3001/api/auth/signin` (GitHub login)

## WebMCP (Browser Tooling)

If a client provides the WebMCP API (`navigator.modelContext`), the web app registers tools on page load:

- `search_skills`
- `get_skill`
- `get_skill_readme`
- `get_install_command`
- `open_skill_page`

## Build And Try The CLI

```bash
npm run build:cli
node packages/cli/dist/bin.js registry set http://localhost:3001
node packages/cli/dist/bin.js search "commit helper"
node packages/cli/dist/bin.js search "best git commits" --mode hybrid
node packages/cli/dist/bin.js install hello-world --dir ./tmp/skills
```

## Publish A Skill (Token Auth)

```bash
# set in web environment before running dev server
$env:PUBLISH_TOKEN="replace-me"

# store token in CLI config
node packages/cli/dist/bin.js auth set replace-me

# publish local folder that includes SKILL.md
node packages/cli/dist/bin.js publish ./samples/hello-world `
  --slug hello-world `
  --name "Hello World" `
  --summary "A tiny starter skill that greets and echoes input." `
  --version 0.1.1 `
  --publisher demo `
  --categories starter `
  --tags hello,example `
  --compatibility codex `
  --license MIT `
  --homepage https://example.com/hello-world `
  --repo https://example.com/hello-world-repo
```

## Build The MCP Server

```bash
npm run build:mcp
```

The MCP server is stdio-based:

```bash
$env:REGISTRY_URL="http://localhost:3001"
node apps/mcp/dist/index.js
```

HTTP mode:

```bash
$env:MCP_TRANSPORT="http"
$env:PORT="8788"
$env:REGISTRY_URL="http://localhost:3001"
# optional auth token for /mcp endpoint
$env:MCP_HTTP_TOKEN="replace-me"
node apps/mcp/dist/index.js
```

## Admin curation endpoint (trusted skill flags)

```bash
$env:ADMIN_TOKEN="replace-me"

curl -X PATCH http://localhost:3001/api/admin/skills/hello-world/trust ^
  -H "content-type: application/json" ^
  -H "x-admin-token: replace-me" ^
  -d "{\"trusted\":true,\"trustTier\":\"silver\"}"
```

## Admin moderation endpoints

Hide a skill:

```bash
curl -X PATCH http://localhost:3001/api/admin/moderation/skills/git-commit-helper ^
  -H "content-type: application/json" ^
  -H "x-admin-token: replace-me" ^
  -H "x-admin-actor: ops-user" ^
  -d "{\"status\":\"hidden\",\"reason\":\"temporary review\"}"
```

Block a specific release:

```bash
curl -X PATCH http://localhost:3001/api/admin/moderation/releases/hello-world/0.1.0 ^
  -H "content-type: application/json" ^
  -H "x-admin-token: replace-me" ^
  -H "x-admin-actor: ops-user" ^
  -d "{\"status\":\"blocked\",\"reason\":\"malicious artifact\"}"
```
