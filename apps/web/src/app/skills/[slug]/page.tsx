import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { prisma } from "@/lib/registry";
import styles from "./skill.module.css";

export const dynamic = "force-dynamic";

function formatCount(v: number): string {
  return new Intl.NumberFormat("en-US").format(v);
}

function formatBuilder(publisher: { handle: string; displayName?: string | null }): string {
  const name = publisher.displayName?.trim();
  return name ? `${name} (@${publisher.handle})` : `@${publisher.handle}`;
}

export default async function SkillPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const skill = await prisma.skill.findFirst({
    where: { slug, status: "active" },
    include: {
      publisher: { select: { handle: true, displayName: true, verified: true } },
      releases: { where: { status: "active" }, orderBy: { createdAt: "desc" } }
    }
  });

  if (!skill) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <h1 className={styles.title}>Not found</h1>
          <p className={styles.muted}>No skill with slug: {slug}</p>
          <Link className={styles.back} href="/">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const install = `gitskills install ${skill.slug}`;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.top}>
          <div>
            <div className={styles.slug}>{skill.slug}</div>
            <h1 className={styles.title}>{skill.name}</h1>
            <p className={styles.summary}>{skill.summary}</p>
            <div className={styles.metrics}>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Builder</span>
                <span className={styles.metricValue}>{formatBuilder(skill.publisher)}</span>
                {skill.publisher.verified ? <span className={styles.verifiedBadge}>Verified</span> : null}
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Trust</span>
                <span className={styles.metricValue}>
                  {skill.trustScore}/100
                  {skill.trusted ? ` (${skill.trustTier ?? "trusted"})` : ""}
                </span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Downloads</span>
                <span className={styles.metricValue}>{formatCount(skill.downloadTotal)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>License</span>
                <span className={styles.metricValue}>{skill.licenseSpdx ?? "unknown"}</span>
              </div>
            </div>
          </div>
          <div className={styles.actions}>
            <div className={styles.installBox}>
              <div className={styles.installLabel}>Install</div>
              <code className={styles.installCmd}>{install}</code>
            </div>
            <div className={styles.links}>
              <Link href="/docs/setup">CLI and MCP setup</Link>
              <Link href="/.well-known/gitskills/index.md">Agent index (Markdown)</Link>
              <Link href={`/skills/${encodeURIComponent(skill.slug)}/README.md`}>README.md</Link>
              <Link href={`/md/skills/${encodeURIComponent(skill.slug)}.md`}>Skill metadata (Markdown)</Link>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>README</h2>
            <div className={styles.readme}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill.readmeMd}</ReactMarkdown>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Versions</h2>
            <div className={styles.versions}>
              {skill.releases.map((r: any) => (
                <div key={r.id} className={styles.versionRow}>
                  <div className={styles.versionLeft}>
                    <div className={styles.version}>{r.version}</div>
                    <div className={styles.versionMeta}>
                      <span>{r.sizeBytes} bytes</span>
                      <span>downloads {formatCount(r.downloadTotal)}</span>
                    </div>
                  </div>
                  <div className={styles.versionRight}>
                    <Link href={`/api/skills/${encodeURIComponent(skill.slug)}/${encodeURIComponent(r.version)}/download`}>
                      download
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <Link href="/">Search</Link>
          <span className={styles.dot}>|</span>
          <a href="/md/search.md?q=hello">Markdown search</a>
          <span className={styles.dot}>|</span>
          <a href="/trusted">Trusted</a>
        </footer>
      </div>
    </div>
  );
}
