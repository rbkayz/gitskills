# gitskills

Open-source skills marketplace (think npm for agent skills): human-friendly web UI, agent-friendly Markdown views, an MCP server, and a CLI to search and install skills.

## What We’re Building

- **Registry API**: publish/search/fetch skills + versions + downloads + trust metadata
- **Web**: browse + search + sort (downloads, trust score, recency), plus Markdown mirrors
- **Agent surfaces**
  - **Markdown-first endpoints** for easy scraping/reading by LLM agents
  - **MCP server** for structured discovery + retrieval
- **CLI**: natural-language search, inspect, and install a skill into a local skills directory

## Repo Layout (Planned)

- `apps/web`: Web UI + API routes (registry)
- `apps/mcp`: MCP server for discovery/retrieval
- `packages/cli`: `gitskills` CLI
- `packages/sdk`: TS client + shared types
- `packages/db`: Prisma schema + migrations
- `docs/PLAN.md`: full build/deploy plan

## Next Step

See `docs/PLAN.md` for the end-to-end plan and MVP milestone breakdown.

