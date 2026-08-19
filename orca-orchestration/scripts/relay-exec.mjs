#!/usr/bin/env node
// scripts/relay-exec.mjs (Zero Dependencies)
// Process-Tree Group Kill, Watchdog Timeout & Canonical Result Contract Generator

import { spawn, execSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

const [, , cmdOrLane, timeoutOrJson, outJsonOrArg, ...restArgs] = process.argv;

if (!cmdOrLane) {
  console.error("Usage: node scripts/relay-exec.mjs <lane|command> [timeoutMs|outJsonPath] [outJsonPath] [args...]");
  process.exit(1);
}

// Ensure ~/.local/bin is in PATH
const localBin = resolve(homedir(), ".local/bin");
if (!process.env.PATH?.includes(localBin)) {
  process.env.PATH = `${localBin}:${process.env.PATH || ""}`;
}

// 1. Read fleet.json if available
let fleetConfig = null;
const fleetPath = resolve(process.cwd(), "fleet.json");
if (existsSync(fleetPath)) {
  try {
    fleetConfig = JSON.parse(readFileSync(fleetPath, "utf8"));
  } catch (e) {
    console.warn(`[Relay] ⚠️ Failed to parse fleet.json: ${e.message}`);
  }
}

// 2. Resolve Command & Lane
let executable = cmdOrLane;
let defaultTimeoutMs = 600000; // 10 mins

if (fleetConfig?.lanes?.[cmdOrLane]) {
  const lane = fleetConfig.lanes[cmdOrLane];
  executable = lane.binary || lane.command || cmdOrLane;
  if (lane.timeout) {
    const match = String(lane.timeout).match(/^(\d+)([smh])?$/);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2] || "ms";
      if (unit === "s") defaultTimeoutMs = val * 1000;
      else if (unit === "m") defaultTimeoutMs = val * 60000;
      else if (unit === "h") defaultTimeoutMs = val * 3600000;
      else defaultTimeoutMs = val;
    }
  }
}

// 3. Parse arguments
let timeoutMs = defaultTimeoutMs;
let outJsonPath = "run_result.json";
let targetArgs = [];

if (timeoutOrJson && !isNaN(Number(timeoutOrJson))) {
  timeoutMs = Number(timeoutOrJson);
  if (outJsonOrArg) {
    if (outJsonOrArg.endsWith(".json")) {
      outJsonPath = outJsonOrArg;
      targetArgs = restArgs;
    } else {
      targetArgs = [outJsonOrArg, ...restArgs];
    }
  }
} else if (timeoutOrJson && timeoutOrJson.endsWith(".json")) {
  outJsonPath = timeoutOrJson;
  if (outJsonOrArg) targetArgs = [outJsonOrArg, ...restArgs];
} else if (timeoutOrJson) {
  targetArgs = [timeoutOrJson, ...(outJsonOrArg ? [outJsonOrArg] : []), ...restArgs];
}

console.log(`[Relay] 🚀 Launching: ${executable} ${targetArgs.join(" ")} (Timeout: ${timeoutMs}ms)`);

const startTime = Date.now();
const child = spawn(executable, targetArgs, {
  stdio: ["inherit", "pipe", "pipe"],
  detached: process.platform !== "win32",
  env: process.env,
  shell: true
});

let stdoutBuffer = "";
let stderrBuffer = "";

if (child.stdout) {
  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk;
    process.stdout.write(chunk);
  });
}

if (child.stderr) {
  child.stderr.on("data", (chunk) => {
    stderrBuffer += chunk;
    process.stderr.write(chunk);
  });
}

const timer = setTimeout(() => {
  console.error(`\n[Relay] ⚠️ Timeout of ${timeoutMs}ms exceeded! Terminating process tree...`);
  killProcessTree(child);
  saveCanonicalResult("timeout", 124);
}, timeoutMs);

function killProcessTree(proc) {
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", proc.pid.toString(), "/T", "/F"]);
  } else {
    try {
      if (proc.pid) process.kill(-proc.pid, "SIGKILL");
    } catch {
      try {
        if (proc.pid) proc.kill("SIGKILL");
      } catch {}
    }
  }
}

function getTouchedFiles() {
  try {
    const output = execSync("git status --porcelain", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[AMD?RCU\s]+\s+/, ""));
  } catch {
    return [];
  }
}

function saveCanonicalResult(status, code, signal = null) {
  clearTimeout(timer);
  const durationMs = Date.now() - startTime;
  const touchedFiles = getTouchedFiles();

  const result = {
    version: "orca-relay.v1",
    status,
    exitCode: code,
    signal,
    durationMs,
    durationFormatted: `${(durationMs / 1000).toFixed(1)}s`,
    timestamp: new Date().toISOString(),
    touchedFiles,
    stderrPreview: stderrBuffer.slice(-1000).trim()
  };

  if (outJsonPath) {
    try {
      writeFileSync(outJsonPath, JSON.stringify(result, null, 2));
      console.log(`[Relay] 💾 Saved canonical run result to: ${outJsonPath} (${touchedFiles.length} touched files)`);
    } catch (err) {
      console.error(`[Relay] ❌ Error writing ${outJsonPath}:`, err.message);
    }
  }
}

child.on("error", (err) => {
  clearTimeout(timer);
  console.error(`[Relay] ❌ Process execution error: ${err.message}`);
  saveCanonicalResult("failed", 1);
  process.exit(1);
});

child.on("close", (code, signal) => {
  clearTimeout(timer);
  const status = code === 0 ? "completed" : (code === 137 ? "oom_killed" : "failed");
  saveCanonicalResult(status, code, signal);
  process.exit(code ?? 1);
});
