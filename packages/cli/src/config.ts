import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type CliConfig = {
  registryUrl: string;
  publishToken: string;
};

const DEFAULTS: CliConfig = {
  registryUrl: "http://localhost:3000",
  publishToken: ""
};

function configDir(): string {
  const appData = process.env.APPDATA;
  if (process.platform === "win32" && appData) return path.join(appData, "gitskills");
  const home = os.homedir();
  return path.join(home, ".config", "gitskills");
}

function configPath(): string {
  return path.join(configDir(), "config.json");
}

export function loadConfig(): CliConfig {
  const p = configPath();
  try {
    const raw = fs.readFileSync(p, "utf8");
    const parsed = JSON.parse(raw) as Partial<CliConfig>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(cfg: CliConfig): void {
  const dir = configDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2) + "\n", "utf8");
}
