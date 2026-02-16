# gitskills

Open-source skills marketplace (think npm for agent skills): human-friendly web UI, agent-friendly Markdown views, an MCP server, and a CLI to search and install skills.

## What We Are Building

- **Registry API**: publish/search/fetch skills + versions + downloads + trust metadata
- **Web**: browse + search + sort (downloads, trust score, recency), plus Markdown mirrors
- **Agent surfaces**
  - **Markdown-first endpoints** for easy scraping/reading by LLM agents
  - **MCP server** for structured discovery + retrieval
- **CLI**: natural-language search, inspect, and install a skill into a local skills directory

## Repo Layout

- `apps/web`: Web UI + API routes (registry)
- `apps/mcp`: MCP server for discovery/retrieval
- `packages/cli`: `gitskills` CLI
- `packages/sdk`: TS client + shared types
- `packages/db`: Prisma schema + migrations
- `docs/PLAN.md`: full build/deploy plan

## CI/CD

- `CI`: runs on push/PR for typecheck + build validation
- `Release Artifacts`: runs on `v*` tags and attaches CLI/MCP build artifacts to the GitHub release

## Next Step

See `docs/PLAN.md` for the end-to-end plan and milestone breakdown.

