import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/registry";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function normalizeQuery(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, 200);
}

function formatCount(v: number): string {
  return new Intl.NumberFormat("en-US").format(v);
}

function formatBuilder(publisher: { handle: string; displayName?: string | null }): string {
  const name = publisher.displayName?.trim();
  return name ? `${name} (@${publisher.handle})` : `@${publisher.handle}`;
}

export default async function Home(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  const sp = await props.searchParams;
  const q = normalizeQuery(sp.q);
  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 8);

  const where: any = q
    ? {
        status: "active",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          ...(tokens.length ? [{ tags: { hasSome: tokens } }] : [])
        ]
      }
    : { status: "active" };

  const skills = await prisma.skill.findMany({
    where,
    orderBy: q ? [{ trustScore: "desc" }, { downloadTotal: "desc" }] : [{ downloadTotal: "desc" }, { trustScore: "desc" }],
    take: 20,
    include: { publisher: { select: { handle: true, displayName: true, verified: true } } }
  });

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.brand}>
            <div className={styles.logoMark} aria-hidden="true" />
            <div>
              <div className={styles.brandName}>gitskills</div>
              <div className={styles.brandTag}>Open skills registry for humans and agents</div>
            </div>
          </div>
          <nav className={styles.nav}>
            <Link href="/trusted">Trusted</Link>
            <Link href="/docs/setup">Setup</Link>
            {session?.user ? <Link href="/api/auth/signout">Sign out</Link> : <Link href="/api/auth/signin">Sign in</Link>}
          </nav>
        </div>

        <form className={styles.search} action="/" method="get">
          <label className={styles.searchLabel} htmlFor="q">
            Search
          </label>
          <input
            className={styles.searchInput}
            id="q"
            name="q"
            placeholder='Try: "git commit message helper"'
            defaultValue={q}
            autoComplete="off"
          />
          <button className={styles.searchButton} type="submit">
            Find skills
          </button>
        </form>

        <div className={styles.agentPanel}>
          <div className={styles.agentTitle}>For agents</div>
          <p className={styles.agentCopy}>Use Markdown endpoints or MCP tools without parsing HTML.</p>
          <div className={styles.agentLinks}>
            <Link href="/.well-known/gitskills/index.md">Open Markdown index</Link>
            <Link href="/md/search.md?q=commit%20message">Open Markdown search example</Link>
            <Link href="/docs/setup">CLI and MCP setup guide</Link>
          </div>
        </div>
      </section>

      <section className={styles.quickstart}>
        <h2>Quickstart</h2>
        <div className={styles.quickGrid}>
          <article className={styles.quickCard}>
            <h3>CLI</h3>
            <p>Install the CLI, point it to this registry, then install a skill.</p>
            <code>npm install -g gitskills</code>
            <code>gitskills registry set http://localhost:3001</code>
            <code>gitskills search "git commit helper"</code>
            <code>gitskills install git-commit-helper</code>
          </article>
          <article className={styles.quickCard}>
            <h3>MCP Server</h3>
            <p>Run the MCP server locally against this registry.</p>
            <code>npm run build:mcp</code>
            <code>REGISTRY_URL=http://localhost:3001 node apps/mcp/dist/index.js</code>
            <p className={styles.quickHint}>PowerShell: $env:REGISTRY_URL="http://localhost:3001"</p>
          </article>
        </div>
      </section>

      <section className={styles.results}>
        <div className={styles.resultsHeader}>
          <h2>{q ? `Results for "${q}"` : "Trending"}</h2>
          <div className={styles.resultsHint}>
            API endpoint: <code>/api/skills?q=...</code>
          </div>
        </div>

        <div className={styles.grid}>
          {skills.map((s: any) => (
            <Link key={s.slug} className={styles.card} href={`/skills/${encodeURIComponent(s.slug)}`}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.name}>{s.name}</div>
                  <div className={styles.slug}>{s.slug}</div>
                </div>
              </div>
              <div className={styles.summary}>{s.summary}</div>
              <div className={styles.metrics}>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Builder</span>
                  <span className={styles.metricValue}>{formatBuilder(s.publisher)}</span>
                  {s.publisher.verified ? <span className={styles.verifiedBadge}>Verified</span> : null}
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Trust</span>
                  <span className={styles.metricValue}>
                    {s.trustScore}/100
                    {s.trusted ? ` (${s.trustTier ?? "trusted"})` : ""}
                  </span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Downloads</span>
                  <span className={styles.metricValue}>{formatCount(s.downloadTotal)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
