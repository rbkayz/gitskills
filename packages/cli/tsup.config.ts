import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin.ts"],
  format: ["esm"],
  platform: "node",
  target: "es2022",
  sourcemap: true,
  clean: true,
  // Bundle workspace deps so the CLI can run without prebuilding the monorepo.
  noExternal: ["@gitskills/sdk"]
});

