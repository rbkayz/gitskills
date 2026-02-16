import Link from "next/link";
import { prisma } from "@/lib/registry";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function normalizeQuery(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, 200);
}

export default async function Home(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const q = normalizeQuery(sp.q);
  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 8);

  const where: any = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          ...(tokens.length ? [{ tags: { hasSome: tokens } }] : [])
        ]
      }
    : {};

  const skills = await prisma.skill.findMany({
    where,
    orderBy: q ? [{ trustScore: "desc" }, { downloadTotal: "desc" }] : [{ downloadTotal: "desc" }, { trustScore: "desc" }],
    take: 20,
    include: { publisher: { select: { handle: true, displayName: true } } }
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
            <Link href="/.well-known/gitskills/index.md">Agent Index (MD)</Link>
            <Link href="/md/search.md?q=commit%20message">Search (MD)</Link>
            <Link href="/trusted">Trusted</Link>
            <Link href="/md/trusted.md">Trusted (MD)</Link>
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

        <div className={styles.heroMeta}>
          <div>
            Markdown-first:
            <code> /.well-known/gitskills/index.md</code>
          </div>
          <div>
            JSON API:
            <code> /api/skills?q=...</code>
          </div>
        </div>
      </section>

      <section className={styles.results}>
        <div className={styles.resultsHeader}>
          <h2>{q ? `Results for "${q}"` : "Trending"}</h2>
          <div className={styles.resultsHint}>
            Install via CLI: <code>gitskills install &lt;slug&gt;</code>
          </div>
        </div>

        <div className={styles.grid}>
          {skills.map((s: any) => (
            <Link key={s.slug} className={styles.card} href={`/skills/${encodeURIComponent(s.slug)}`}>
              <div className={styles.cardTop}>
                <div className={styles.slug}>{s.slug}</div>
                <div className={styles.metrics}>
                  {s.trusted ? <span className={styles.trustBadge}>{s.trustTier ?? "community"}</span> : null}
                  <span>trust {s.trustScore}</span>
                  <span>downloads {s.downloadTotal}</span>
                </div>
              </div>
              <div className={styles.name}>{s.name}</div>
              <div className={styles.summary}>{s.summary}</div>
              <div className={styles.meta}>
                <span>publisher {s.publisher.handle}</span>
                <span>{s.licenseSpdx ?? "license unknown"}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

