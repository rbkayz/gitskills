# Agent Access Surface

This registry exposes three agent-friendly interfaces: Markdown endpoints, MCP tools/resources, and WebMCP.

## Markdown Endpoints

- Index: `/.well-known/gitskills/index.md`
- Search: `/md/search.md?q=<query>`
- Trusted feed: `/md/trusted.md`
- Trending feed: `/md/trending.md?days=7`
- Skill card: `/md/skills/<slug>.md`
- Raw skill README: `/skills/<slug>/README.md`

## MCP Server

Build and run:

```bash
npm run build:mcp
REGISTRY_URL=http://localhost:3001 node apps/mcp/dist/index.js
```

Tools:

- `search_skills`
- `get_skill`
- `get_skill_readme`
- `get_install_command`

Resources:

- `gitskills://index`
- `gitskills://skills/{slug}.md`

## WebMCP

The web app registers WebMCP tools when the client exposes `navigator.modelContext`.
Current tools mirror the MCP server behavior:

- `search_skills`
- `get_skill`
- `get_skill_readme`
- `get_install_command`
- `open_skill_page`
