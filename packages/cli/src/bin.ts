#!/usr/bin/env node
import { Command } from "commander";

import { loadConfig, saveConfig } from "./config.js";
import { installSkill } from "./install.js";
import { RegistryClient } from "@gitskills/sdk";

const program = new Command();
program.name("gitskills").description("Skills marketplace CLI").version("0.0.0");

program
  .command("registry")
  .description("Get or set the registry URL")
  .argument("<action>", "get|set")
  .argument("[value]", "registry URL for set")
  .action((action: string, value?: string) => {
    const cfg = loadConfig();
    if (action === "get") {
      process.stdout.write(cfg.registryUrl + "\n");
      return;
    }
    if (action === "set") {
      if (!value) throw new Error("missing registry url");
      const next = { ...cfg, registryUrl: value };
      saveConfig(next);
      process.stdout.write(next.registryUrl + "\n");
      return;
    }
    throw new Error("action must be get or set");
  });

program
  .command("search")
  .description("Search skills (keyword or natural language)")
  .argument("<query>", "search query")
  .option("--category <category>", "filter by category")
  .option("--tag <tag>", "filter by tag")
  .option("--compatibility <compat>", "filter by compatibility")
  .option("--publisher <handle>", "filter by publisher handle")
  .option("--min-trust <n>", "minimum trust score", (v) => Number(v))
  .option("--trusted", "only show trusted skills")
  .option("--sort <mode>", "downloads|trust|recent", "downloads")
  .action(async (query: string, options) => {
    const cfg = loadConfig();
    const client = new RegistryClient(cfg.registryUrl);
    const res = await client.searchSkills(query, {
      category: options.category,
      tag: options.tag,
      compatibility: options.compatibility,
      publisher: options.publisher,
      minTrust: Number.isFinite(options.minTrust) ? options.minTrust : undefined,
      trusted: Boolean(options.trusted) || undefined,
      sort: options.sort
    });
    for (const s of res.skills) {
      process.stdout.write(
        `${s.slug}\ttrust=${s.trustScore}\tdl=${s.downloadTotal}\t${s.name}\n`
      );
    }
  });

program
  .command("info")
  .description("Show skill details")
  .argument("<slug>", "skill slug")
  .action(async (slug: string) => {
    const cfg = loadConfig();
    const client = new RegistryClient(cfg.registryUrl);
    const s = await client.getSkill(slug);
    process.stdout.write(`${s.name} (${s.slug})\n`);
    process.stdout.write(`${s.summary}\n\n`);
    process.stdout.write(`trust: ${s.trustScore}\n`);
    process.stdout.write(`trusted: ${s.trusted ? `yes (${s.trustTier ?? "community"})` : "no"}\n`);
    process.stdout.write(`downloads: ${s.downloadTotal}\n`);
    process.stdout.write(`publisher: ${s.publisher.handle}\n`);
    process.stdout.write(`tags: ${s.tags.join(", ")}\n`);
    process.stdout.write(`categories: ${s.categories.join(", ")}\n`);
    process.stdout.write(`compatibility: ${s.compatibility.join(", ")}\n`);
    process.stdout.write(`versions: ${s.releases.map((r: { version: string }) => r.version).join(", ")}\n`);
  });

program
  .command("install")
  .description("Install a skill into a local skills directory")
  .argument("<slug>", "skill slug")
  .option("--version <v>", "version to install")
  .option("--dir <path>", "install root dir (default: $CODEX_HOME/skills or ./skills)")
  .option("--force", "overwrite if destination exists")
  .action(async (slug: string, options) => {
    const cfg = loadConfig();
    const out = await installSkill({
      registryUrl: cfg.registryUrl,
      slug,
      version: options.version,
      dir: options.dir,
      force: Boolean(options.force)
    });
    process.stdout.write(`installed ${slug}@${out.version} -> ${out.installedTo}\n`);
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(String(err?.message ?? err) + "\n");
  process.exit(1);
});
