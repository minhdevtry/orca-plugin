#!/usr/bin/env node
// scripts/verify-premerge.mjs (Zero Dependencies)
// Enforces fleet.json autoMerge.forbiddenPaths against git diff

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const baseRef = process.argv[2] || "origin/main";
const fleetPath = resolve(process.cwd(), "fleet.json");

if (!existsSync(fleetPath)) {
  console.log("[PreMerge] ℹ️ No fleet.json found; skipping forbidden path check.");
  process.exit(0);
}

let config;
try {
  config = JSON.parse(readFileSync(fleetPath, "utf8"));
} catch (e) {
  console.error(`[PreMerge] ❌ Invalid fleet.json: ${e.message}`);
  process.exit(1);
}

const forbiddenPatterns = config.autoMerge?.forbiddenPaths || [];
if (forbiddenPatterns.length === 0) {
  console.log("[PreMerge] ✅ No forbidden paths defined in fleet.json.");
  process.exit(0);
}

let changedFiles = [];
try {
  const diffOutput = execSync(`git diff --name-only ${baseRef}...HEAD`, { encoding: "utf8" });
  changedFiles = diffOutput.split("\n").map((f) => f.trim()).filter(Boolean);
} catch {
  try {
    const diffOutput = execSync("git diff --name-only HEAD~1", { encoding: "utf8" });
    changedFiles = diffOutput.split("\n").map((f) => f.trim()).filter(Boolean);
  } catch (err) {
    console.warn(`[PreMerge] ⚠️ Could not determine git diff: ${err.message}`);
  }
}

function matchesPattern(file, pattern) {
  const regexPattern = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, ".*")
    .replace(/(?<!\.)\*/g, "[^/]*");
  return new RegExp(`^${regexPattern}$`).test(file);
}

const violations = [];
for (const file of changedFiles) {
  for (const pattern of forbiddenPatterns) {
    if (matchesPattern(file, pattern)) {
      violations.push({ file, pattern });
    }
  }
}

if (violations.length > 0) {
  console.error("\n🚫 [PreMerge Gate VIOLATION] Auto-Merge Blocked! The diff touches protected/forbidden files:");
  violations.forEach((v) => console.error(`   ❌ ${v.file} (Matches: ${v.pattern})`));
  console.error("\n👉 Action required: Transition to `needs-info` and request human approval.\n");
  process.exit(1);
}

console.log(`[PreMerge] ✅ All ${changedFiles.length} changed files passed forbidden-path checks.`);
process.exit(0);
