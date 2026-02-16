import Link from "next/link";
import { prisma } from "@/lib/registry";
import styles from "./trusted.module.css";

export const dynamic = "force-dynamic";

function tierLabel(tier: string | null): string {
  return tier ?? "community";
}

export default async function TrustedPage() {
  const skills = await prisma.skill.findMany({
    where: { trusted: true },
    include: { publisher: { select: { handle: true } } },
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
          <Link href="/md/trusted.md">Trusted (Markdown)</Link>
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
            <div className={styles.meta}>
              <span>trust {s.trustScore}</span>
              <span>downloads {s.downloadTotal}</span>
              <span>publisher {s.publisher.handle}</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

