import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { prisma } from "@/lib/registry";
import styles from "./skill.module.css";

export const dynamic = "force-dynamic";

export default async function SkillPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      publisher: { select: { handle: true, displayName: true } },
      releases: { orderBy: { createdAt: "desc" } }
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
            <div className={styles.metaRow}>
              <span>publisher {skill.publisher.handle}</span>
              {skill.trusted ? <span className={styles.trustBadge}>{skill.trustTier ?? "community"} trusted</span> : null}
              <span>trust {skill.trustScore}</span>
              <span>downloads {skill.downloadTotal}</span>
              <span>{skill.licenseSpdx ?? "license unknown"}</span>
            </div>
          </div>
          <div className={styles.actions}>
            <div className={styles.installBox}>
              <div className={styles.installLabel}>Install</div>
              <code className={styles.installCmd}>{install}</code>
            </div>
            <div className={styles.links}>
              <Link href="/.well-known/gitskills/index.md">Agent index</Link>
              <Link href={`/skills/${encodeURIComponent(skill.slug)}/README.md`}>README.md</Link>
              <Link href={`/md/skills/${encodeURIComponent(skill.slug)}.md`}>Skill (MD)</Link>
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
                      <span>downloads {r.downloadTotal}</span>
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
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          <a href="/md/search.md?q=hello">Markdown search</a>
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          <a href="/trusted">Trusted</a>
        </footer>
      </div>
    </div>
  );
}

