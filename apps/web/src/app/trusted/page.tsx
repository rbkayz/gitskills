import Link from "next/link";
import { prisma } from "@/lib/registry";
import styles from "./trusted.module.css";

export const dynamic = "force-dynamic";

function tierLabel(tier: string | null): string {
  return tier ?? "community";
}

function formatCount(v: number): string {
  return new Intl.NumberFormat("en-US").format(v);
}

function formatBuilder(publisher: { handle: string; displayName?: string | null }): string {
  const name = publisher.displayName?.trim();
  return name ? `${name} (@${publisher.handle})` : `@${publisher.handle}`;
}

export default async function TrustedPage() {
  const skills = await prisma.skill.findMany({
    where: { trusted: true, status: "active" },
    include: { publisher: { select: { handle: true, displayName: true, verified: true } } },
    orderBy: [{ trustScore: "desc" }, { downloadTotal: "desc" }, { updatedAt: "desc" }],
    take: 200
  });

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Trusted Skills</h1>
        <p>Curated skills flagged as trusted by registry maintainers.</p>
        <div className={styles.links}>
          <Link href="/">Back to search</Link>
          <Link href="/md/trusted.md">Trusted Markdown feed</Link>
          <Link href="/docs/setup">CLI and MCP setup</Link>
        </div>
      </section>

      <section className={styles.grid}>
        {skills.map((s) => (
          <Link key={s.slug} className={styles.card} href={`/skills/${encodeURIComponent(s.slug)}`}>
            <div className={styles.top}>
              <div className={styles.slug}>{s.slug}</div>
              <div className={styles.badge}>{tierLabel(s.trustTier)}</div>
            </div>
            <div className={styles.name}>{s.name}</div>
            <div className={styles.summary}>{s.summary}</div>
            <div className={styles.metrics}>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Builder</span>
                <span className={styles.metricValue}>{formatBuilder(s.publisher)}</span>
                {s.publisher.verified ? <span className={styles.verifiedBadge}>Verified</span> : null}
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Trust</span>
                <span className={styles.metricValue}>{s.trustScore}/100 ({tierLabel(s.trustTier)})</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Downloads</span>
                <span className={styles.metricValue}>{formatCount(s.downloadTotal)}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
