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

Useful URLs (assuming `-p 3001`):

- `http://localhost:3001/`
- `http://localhost:3001/api/skills?q=hello`
- `http://localhost:3001/md/search.md?q=hello`
- `http://localhost:3001/md/trusted.md`
- `http://localhost:3001/.well-known/gitskills/index.md`
- `http://localhost:3001/md/skills/hello-world.md`
- `http://localhost:3001/skills/hello-world/README.md`

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
node packages/cli/dist/bin.js install hello-world --dir ./tmp/skills
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

## Admin curation endpoint (trusted skill flags)

```bash
$env:ADMIN_TOKEN="replace-me"

curl -X PATCH http://localhost:3001/api/admin/skills/hello-world/trust ^
  -H "content-type: application/json" ^
  -H "x-admin-token: replace-me" ^
  -d "{\"trusted\":true,\"trustTier\":\"silver\"}"
```
