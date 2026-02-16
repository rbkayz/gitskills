import assert from "node:assert/strict";
import test from "node:test";

import { validateArchivePath } from "./install.js";

test("validateArchivePath accepts normal relative paths", () => {
  validateArchivePath("SKILL.md");
  validateArchivePath("nested/path/file.txt");
  validateArchivePath("./nested/path/file.txt");
});

test("validateArchivePath rejects absolute or traversal paths", () => {
  assert.throws(() => validateArchivePath("/etc/passwd"));
  assert.throws(() => validateArchivePath("../escape.txt"));
  assert.throws(() => validateArchivePath("a/../../b"));
});

test("validateArchivePath rejects very deep paths", () => {
  const deep = new Array(25).fill("x").join("/") + "/file.txt";
  assert.throws(() => validateArchivePath(deep));
});

