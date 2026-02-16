# Agent Notes (gitskills)

This repo builds a skills marketplace with explicit **agent interfaces**:

- **Markdown endpoints**: stable URLs that return `text/markdown` so agents can read without HTML parsing.
- **MCP server**: structured tools for search and retrieval.
- **CLI**: deterministic install flows for agents and CI.

## Agent-Friendly Web Contract (MVP)

- Index: `/.well-known/gitskills/index.md`
- Search: `/md/search.md?q=<natural language>&category=...&tag=...`
- Skill card: `/md/skills/<slug>.md`
- README: `/skills/<slug>/README.md`

## MCP Contract (MVP)

Tools:

- `search_skills(query, filters)`
- `get_skill(slug)`
- `get_skill_readme(slug)`
- `get_install_command(slug, version?)`

## WebMCP Compatibility

If the browser provides the WebMCP API (`navigator.modelContext`), the website registers equivalent tools for in-page agent access:

- `search_skills`
- `get_skill`
- `get_skill_readme`
- `get_install_command`
- `open_skill_page`

## CLI Contract (MVP)

- `gitskills search "<query>"`
- `gitskills info <slug>`
- `gitskills install <slug> [--version v] [--dir path]`
