#!/usr/bin/env node
// scripts/relay-exec.mjs (Zero Dependencies)
// Process-Tree Group Kill & Watchdog Timeout Wrapper
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const [, , cmd, timeoutStr, outJsonPath, ...args] = process.argv;

if (!cmd) {
  console.error("Usage: node scripts/relay-exec.mjs <cmd> <timeoutMs> <outJsonPath> [args...]");
  process.exit(1);
}

const timeoutMs = parseInt(timeoutStr, 10) || 600000; // Mặc định 10 phút

console.log(`[Relay] 🚀 Đang khởi chạy: ${cmd} ${args.join(" ")} (Timeout: ${timeoutMs}ms)`);

const startTime = Date.now();
const child = spawn(cmd, args, {
  stdio: ["inherit", "pipe", "pipe"],
  detached: process.platform !== "win32", // Tạo process group riêng trên Linux/macOS
  env: process.env
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
  console.error(`\n[Relay] ⚠️ Đã vượt quá timeout ${timeoutMs}ms! Đang dọn sạch Process Tree...`);
  killProcessTree(child);
  saveResult("timeout", 124);
}, timeoutMs);

function killProcessTree(proc) {
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", proc.pid.toString(), "/T", "/F"]);
  } else {
    try {
      // Kill toàn bộ process group (tránh leak child processes)
      process.kill(-proc.pid, "SIGKILL");
    } catch {
      proc.kill("SIGKILL");
    }
  }
}

function saveResult(status, code, signal = null) {
  clearTimeout(timer);
  const durationMs = Date.now() - startTime;
  const result = {
    version: "orca-relay.v1",
    status,
    exitCode: code,
    signal,
    durationMs,
    durationFormatted: `${(durationMs / 1000).toFixed(1)}s`,
    timestamp: new Date().toISOString(),
    stderrPreview: stderrBuffer.slice(-1000)
  };
  if (outJsonPath) {
    try {
      writeFileSync(outJsonPath, JSON.stringify(result, null, 2));
      console.log(`[Relay] 💾 Đã lưu kết quả thực thi vào: ${outJsonPath}`);
    } catch (err) {
      console.error(`[Relay] ❌ Lỗi khi ghi file ${outJsonPath}:`, err.message);
    }
  }
}

child.on("close", (code, signal) => {
  clearTimeout(timer);
  const status = code === 0 ? "completed" : (code === 137 ? "oom_killed" : "failed");
  saveResult(status, code, signal);
  process.exit(code ?? 1);
});
