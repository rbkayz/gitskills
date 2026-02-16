import Link from "next/link";
import styles from "./setup.module.css";

export const dynamic = "force-static";

export default function SetupPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Setup: CLI and MCP</h1>
        <p>Use these commands to search, install skills, and connect agent tooling.</p>
        <div className={styles.links}>
          <Link href="/">Back to search</Link>
          <Link href="/.well-known/gitskills/index.md">Open Markdown index</Link>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>CLI Quickstart</h2>
          <p>Install the CLI and point it to this registry.</p>
          <code>npm install -g gitskills</code>
          <code>gitskills registry set http://localhost:3001</code>
          <code>gitskills search "git commit helper"</code>
          <code>gitskills install git-commit-helper</code>
        </article>

        <article className={styles.card}>
          <h2>MCP Server Quickstart</h2>
          <p>Build and run the local MCP server against this registry.</p>
          <code>npm run build:mcp</code>
          <code>REGISTRY_URL=http://localhost:3001 node apps/mcp/dist/index.js</code>
          <p className={styles.note}>PowerShell:</p>
          <code>$env:REGISTRY_URL="http://localhost:3001"; node apps/mcp/dist/index.js</code>
        </article>
      </section>

      <section className={styles.agentSurface}>
        <h2>Agent Access Surface</h2>
        <ul>
          <li>
            Markdown index: <code>/.well-known/gitskills/index.md</code>
          </li>
          <li>
            Markdown skill card: <code>/md/skills/&lt;slug&gt;.md</code>
          </li>
          <li>
            Markdown search: <code>/md/search.md?q=&lt;query&gt;</code>
          </li>
          <li>
            MCP tools: <code>search_skills</code>, <code>get_skill</code>, <code>get_skill_readme</code>,{" "}
            <code>get_install_command</code>
          </li>
          <li>WebMCP is available in-browser when the client exposes <code>navigator.modelContext</code>.</li>
        </ul>
      </section>
    </main>
  );
}
