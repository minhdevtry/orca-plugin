---
name: orca-orchestration
description: Use when orchestrating autonomous tasks, running subagent waves, coordinating multi-agent runs, or executing full-lifecycle issues in Orca ADE.
---

# Orca Multi-Agent Orchestration

## Overview
End-to-end multi-agent orchestration engine for Orca ADE. Coordinates a 3-agent fleet across isolated Git Worktrees, native Decision Gates, and Matt Pocock skills with deterministic self-healing loops and strict 3-tier hierarchy enforcement.

### ⚠️ CLI Executable Resolution
Choose the Orca CLI executable once per session:
- If `ORCA_CLI_COMMAND` is set, use its value.
- On Linux outside an Orca-managed terminal, use `orca-ide` or `~/.local/bin/orca`. **Never run bare `/usr/bin/orca`** (which starts the GNOME Screen Reader).
- Otherwise, use `orca`.
- To inspect dynamic CLI flags supported by your current Orca build: `orca skills get orchestration --full`.

---

## When to Use
Use this skill when:
- Orchestrating tasks autonomously across multiple specialized agents in Orca ADE.
- Managing an issue from triage through spec, implementation, review, and release.
- Dispatching subagents in isolated Git Worktrees with supervised worker contracts.
- Setting up Orca Scheduled Automations for background task ingestion.

Do NOT use when:
- Performing a quick single-file edit in the current workspace.
- Running a simple local test or one-off shell command.

---

## Architecture & Fleet Matrix

### Specialized Agent Profiles

| Role | Profile & Model | Primary Responsibilities | Canonical Launch Command |
| :--- | :--- | :--- | :--- |
| **Coordinator / Spec** | Claude Official (Sonnet 5) | Triage, Spec design, Gate supervision, PR release | `orca terminal create --worktree "<selector>" --title "Official Claude" --command "claude --permission-mode bypassPermissions --dangerously-skip-permissions" --focus --json` |
| **Coder / TDD** | MiniMax-M3 (Custom Gateway) | High-throughput coding, Unit test TDD, Syntax review | `orca terminal create --worktree "<selector>" --title "MiniMax-M3" --command "claude-m3 --permission-mode bypassPermissions --dangerously-skip-permissions" --focus --json` |
| **Architect / Research** | Antigravity CLI (`agy` Gemini 3.7 Flash) | Pro/Con technical research, `CONTEXT.md` architecture review | `orca terminal create --worktree "<selector>" --title "worker-agy" --command "agy --model gemini-3.7-flash-high --dangerously-skip-permissions" --focus --json` |

### 3-Tier Hierarchy Rules (Max Depth = 3)
```
Level 1: Lead Coordinator (Root workspace or Orca Scheduled Automation)
   │
   └── Level 2: Feature Worker (Git Worktree: `agent/task-<id>`)
          │
          └── Level 3: Leaf Helper (Sub-terminal / Split pane in same worktree)
                 └── 🚫 Non-Proliferation: NEVER spawn children (Depth <= 3)
```

1. **Level 1 (Lead Coordinator)**: Owns the Run, creates tasks, dispatches to Level 2 workers, controls Decision Gates.
2. **Level 2 (Feature Worker)**: Executes `/implement` and `/tdd`. May spawn **at most 1 Level 3 Leaf Helper** (`helper-agy` or `helper-m3`) for assistance.
3. **Level 3 (Leaf Helper)**: Dedicated task assistant (mock data, documentation lookup). Must execute assigned tasks directly and idle upon completion.

---

## State Alignment & Desync Healing (Tự Động Chữa Lệch Trạng Thái)

> ⚠️ **THE DESYNC HEALING RULE**:
> If a human accidentally drags a card on the Orca UI to the wrong column, or if a terminal session's worktree status deviates from the remote issue label:
> **The GitHub Issue Label is the authoritative source of truth.**

### 🔄 Pre-Flight Reconciliation Algorithm:
Whenever a Lead Agent or subagent terminal starts working on task `#<id>`, it MUST run this reconciliation check:

```bash
# 1. Query remote truth from GitHub:
REMOTE_LABEL=$(gh issue view <id> --json labels -q '.labels[].name' | grep -E '^(needs-triage|needs-info|ready-for-agent|in-progress|ready-for-human)$' | head -n 1)

# 2. Force-reconcile Orca Workspace Board to match remote label:
if [ -n "$REMOTE_LABEL" ]; then
  orca worktree set --worktree active --issue <id> --workspace-status "$REMOTE_LABEL" \
    --comment "State-heal: aligned Orca workspace card with GitHub label [$REMOTE_LABEL]" --json
fi
```

### 🔒 Atomic Dual-Update Invariant:
When advancing through the 6-stage lifecycle, the Agent MUST ALWAYS execute status updates as a paired atomic operation:
1. `gh issue edit <id> --add-label "<new-status>" --remove-label "<old-status>"`
2. `orca worktree set --worktree "<worktree-selector>" --issue <id> --workspace-status "<new-status>" --json`

---

## Step-by-Step Execution Process

```
[Phase 1: Triage & Spec] ──> [Phase 2: Orca Run & Task Init]
                                           │
┌──────────────────────────────────────────┘
▼
[Phase 3: Dispatch & TDD] ──> [Phase 4: Shell Verification & Self-Healing]
                                           │
┌──────────────────────────────────────────┘
▼
[Phase 5: Decision Gate & 3-Agent Review] ──> [Phase 6: Release PR & Sync]
```

### Phase 1: 100% Autonomous Ingestion & Triage
> ⚠️ **AUTONOMY INVARIANT**: The Coordinator NEVER stops to ask human permission before triaging. Triage executes immediately and autonomously.

1. Fetch issue payload (GitHub or GitLab):
   ```bash
   # GitHub
   gh issue view <id> --json number,title,body
   # GitLab
   glab issue view <id>
   ```
2. Synchronize workspace card status:
   ```bash
   orca worktree set --worktree active --issue <id> --workspace-status needs-triage --comment "Triaging and analyzing scope" --json
   # GitHub: gh issue edit <id> --add-label "needs-triage"
   # GitLab: glab issue update <id> --label "needs-triage"
   ```
3. Assurance Level & Topology Selection:
   - **`Fast` (Minor / Reversible / $\le 5$ lines)**: Keep direct execution in current workspace. Do NOT open a Git Worktree. Fix in-place, run tests, and commit.
   - **`Standard` (Material Feature / Bugfix)**: Open 1 isolated Git Worktree (`agent/task-<id>`), dispatch MiniMax-M3, and verify with Antigravity.
   - **`Full` (Sensitive / Core Architecture / Payment API)**: Full Worktree isolation, 9 API Design Gates, Full Gauntlet Testing, and 3-Agent Blind Review Gate.
4. Analyze Issue & Branching Decision:
   - **Branch A: Clear & Actionable** ➔ Invoke `/triage` and `/to-spec`.
     - Write `spec.md` with explicit module interfaces, dependencies, and file modification targets.
     - **9 API Design Gates (`old-coder-api`)**: If designing backend endpoints, `spec.md` MUST comply with:
       1. *Boring*: Plural nouns (`/orders`), standard status codes (`400`, `404`, `422`, `429`).
       2. *Don't break userspace*: Additive optional fields only; never rename/delete existing fields.
       3. *Simple Auth*: Scoped API keys for machine-to-machine; OAuth for client sessions.
       4. *Server Authorization*: Enforce tenant/user access server-side; never trust client headers.
       5. *Idempotency Keys*: Mandatory for mutation operations with side-effects (payments, refunds).
       6. *Rate Limiting*: Every endpoint scoped with headers (`Retry-After`).
       7. *Cursor Pagination*: `WHERE id > :cursor LIMIT :n`; strictly avoid `OFFSET`.
       8. *Expensive fields optional*: Gated behind `?include=...` (disabled by default).
       9. *No leakage*: Zero database table IDs, internal enums, or raw errors in public JSON.
     - Transition status to `ready-for-agent`:
       ```bash
       orca worktree set --worktree active --issue <id> --workspace-status ready-for-agent --comment "Spec approved with 9 API gates, ready for build" --json
       # GitHub: gh issue edit <id> --add-label "ready-for-agent" --remove-label "needs-triage"
       # GitLab: glab issue update <id> --label "ready-for-agent" --unlabel "needs-triage"
       ```
       Proceed directly to Phase 2.
   - **Branch B: Missing Information / Questions / Ambiguity** ➔ Invoke `/to-questionnaire`. Format structured multiple-choice questions, transition label to `needs-info`, and post questions as a comment on the issue:
     ```bash
     orca worktree set --worktree active --issue <id> --workspace-status needs-info --comment "Waiting for human input on requirements" --json
     # GitHub: gh issue edit <id> --add-label "needs-info" --remove-label "needs-triage" && gh issue comment <id> --body "<questionnaire>"
     # GitLab: glab issue update <id> --label "needs-info" --unlabel "needs-triage" && glab issue note <id> --message "<questionnaire>"
     ```
     Yield turn to wait for human reply on GitHub/GitLab. **DO NOT freeze in an interactive shell loop**.

---

### Phase 2: Run & Worktree Initialization
1. Create native Orchestration Run:
   ```bash
   RUN_ID=$(orca orchestration run-create --objective "Implement task #<id>: <title>" --json | jq -r .result.run.id)
   ```
2. Create native Orchestration Task:
   ```bash
   TASK_ID=$(orca orchestration task-create --spec "Implement feature according to spec.md" --task-title "Task #<id>" --json | jq -r .result.task.id)
   ```
3. Create isolated Git Worktree:
   ```bash
   orca worktree create --name "agent/task-<id>" --setup run --json
   ```
- **Completion Criterion**: Worktree created at `~/orca/workspaces/<repo>/agent-task-<id>` with active branch.

---

### Phase 3: Worker Dispatch & Worker Safety Capsule
1. Launch Coder terminal (MiniMax-M3) in `agent/task-<id>` using Profile B, capturing `<childHandle>`.
2. Synchronize status:
   ```bash
   orca worktree set --worktree "name:agent/task-<id>" --issue <id> --workspace-status in-progress --comment "MiniMax-M3 implementing with TDD" --json
   # GitHub: gh issue edit <id> --add-label "in-progress" --remove-label "needs-triage,ready-for-agent"
   # GitLab: glab issue update <id> --label "in-progress" --unlabel "needs-triage,ready-for-agent"
   ```
3. Inject **Worker Safety Capsule Contract** into dispatch prompt:
   ```bash
   orca orchestration dispatch --task $TASK_ID --to <childHandle> --inject --json
   orca terminal send --terminal <childHandle> \
     --text "Task: /implement task #<id>
=== 🛡️ WORKER SAFETY CAPSULE ===
ROLE: Finite implementation worker (STRICTLY FORBIDDEN from starting sub-orchestration, Depth <= 3).
OBJECTIVE: Implement task #<id> strictly per spec.md and CONTEXT.md using /tdd.
EXCLUSIONS: Do NOT touch files outside the targeted feature slice; do NOT modify project infrastructure.
AUTHORITY:
  - Exact Read Paths: [spec.md, CONTEXT.md, targeted source and test files]
  - Exact Write Paths: [targeted source files, targeted test files]
  - External Side Effects: NONE (no network mutation, no external publishing)
SAFETY BOUNDARY:
  - Never bypass test gates or expose credentials.
  - Generate run_result.json upon completion.
================================" \
     --enter --json
   ```
   *(Optional Watchdog Execution: `node scripts/relay-exec.mjs claude-m3 900000 run_result.json -p "Task: /implement task #<id>"`)*
4. **Token-Efficient Execution Modes**:
   > ⚠️ **DEFAULT INVARIANT**: The Coordinator is autonomous by default. It NEVER yields the turn back to a human mid-lifecycle unless a genuine Tier 2 blocker (see Question & Blocker Handling) requires one. "I'll wait for you to come back" is not a valid default — it is the exact behavior that breaks scheduled/unattended runs.
   - **Mode A (Autonomous / Bounded Probe Loop — DEFAULT, use in scheduled automations and any unattended run)**: Probe in short 15-second intervals via `orca orchestration check --types worker_done --timeout-ms 15000 --json` instead of a single 600s blocking freeze. Cap probing at **40 iterations (~10 minutes)** per attempt; if still not done, re-issue the probe loop rather than surrender the turn. Only escalate to a human if Phase 4's Max-2-Bounces budget is exhausted (see below) — never simply because probing is taking a while.
   - **Mode B (Interactive / Human-Supervised — opt-in only)**: Use ONLY when the Coordinator was started directly by a human in a live terminal (not via `orca automations`) AND the human has explicitly said they want to watch progress instead of waiting. In that case, and only then, the Coordinator may report status and yield. Never select this mode by default, and never select it inside an automation-triggered run.
- **Completion Criterion**: Subagent finishes implementation and card is ready for verification.

---

### Phase 4: Shell Verification & Multi-Layer Gauntlet

> ⚠️ **MANDATORY INVARIANT (Evidence Before Assertions)**: Never accept an agent's self-claim of passing tests. The Coordinator MUST execute the shell verification directly.

1. Execute test suite / Gauntlet directly in child worktree:
   ```bash
   cd /home/minhdn3/orca/workspaces/<repo>/agent-task-<id>
   # Run Standard Tests OR Full Quality Gauntlet:
   npm test || ./scripts/run-gauntlet.sh .
   ```
2. **If Exit Code = 0 (PASS)**: Check the Gauntlet output for any layer reported as skipped (e.g. "Bỏ qua Stryker", no coverage config). **A skipped layer is missing evidence, not a passing signal.** Note every skipped layer explicitly in the Phase 5 review inputs — do not let a green `npm test` exit code imply the whole Gauntlet passed. Then advance to Phase 5.
3. **If Exit Code != 0 (FAIL)**:
   - **Case A: Minor Failure (Fix-in-Place Rule)**: If the failure is minor (lint, formatting, typo, small $\le 5$ line bug, or missing catch block), the **Coordinator MUST fix it directly in the worktree** and re-run `npm test`. **DO NOT bounce back to the worker for trivial fixes** (saving massive tokens and eliminating 10-minute wait cycles).
   - **Case B: Major Architectural Failure (Max 2 Bounces)**: If fundamental logic is broken:
     ```bash
     orca terminal send --terminal <childHandle> \
       --text "Tests failed with errors: <error_log>. Activate /diagnosing-bugs and fix the implementation until npm test passes." \
       --enter --json
     ```
     Yield to let worker code in background without holding Coordinator turn.
   - **If still failing after 2 major attempts**: Set `needs-info`, transition label, and escalate to human.
- **Completion Criterion**: `npm test` / `run-gauntlet.sh` exit code is 0 in the child worktree.

---

### Phase 5: Tripartite Review Committee & Blind Adversarial Gate

1. Lock task with native Decision Gate:
   ```bash
   GATE_ID=$(orca orchestration gate-create --task $TASK_ID --question "Does the 3-agent committee approve task #<id>?" --options '["yes","no"]' --json | jq -r .result.gate.id)
   ```
2. **Blind Adversarial Review Protocol (Antigravity CLI / Gemini 3.7 Flash High)**:
   - To eliminate Confirmation Bias, feed Antigravity **ONLY 4 pure inputs**:
     1. Issue Requirements (`gh issue view <id>` / `glab issue view <id>`).
     2. Approved `spec.md`.
     3. Current Worktree Git Commit SHA.
     4. Gauntlet Execution Output (`scripts/run-gauntlet.sh`).
   - Run via Safe Tripwire: `./scripts/safe-research.sh ~/orca/workspaces/<repo>/agent-task-<id>`
   - Parallel Review Axes:
     - **Axis 1 (Standards)** via **MiniMax-M3**: TypeScript types, lint, formatting, typos, smell baseline.
     - **Axis 2 (Architecture & Audit)** via **Antigravity CLI (Gemini 3.7 Flash High)**: Module boundaries, `CONTEXT.md` adherence, mutation resistance.
     - **Axis 3 (Spec Compliance)** via **Claude Official**: Verification against `spec.md` & 9 API Design Gates.
3. **Review Finding Remediation**:
   - **Minor Issues**: The Reviewing Coordinator applies quick fixes directly to the branch in-place.
   - **Major Violations**: Reject gate and request targeted worker rewrite.
4. Resolve Gate & Cleanup:
   ```bash
   orca orchestration gate-resolve --id $GATE_ID --resolution "yes" --json
   orca orchestration worker-release --dispatch <dispatchId> --json
   ```
- **Completion Criterion**: Decision Gate resolved with `"yes"`.

---

### Phase 6: Release, Rebase & Autonomous Auto-Merge MR/PR
> 🚀 **AUTONOMOUS MERGE INVARIANT**: Once Gemini 3.7 (`agy`) and the 3-Agent Committee approve the review and all unit tests pass, the Coordinator automatically creates, approves, and MERGES the MR/PR and tears down the worktree.

0. **Forbidden-Paths Pre-Merge Gate**: Before creating the PR/MR, diff the branch against the base ref and check touched files against `fleet.json`'s `autoMerge.forbiddenPaths`. If the diff touches any forbidden path, **do NOT auto-merge** — transition to `needs-info` and run the escalation protocol below instead (this overrides an otherwise-passing Decision Gate; a passing Gate is necessary but not sufficient for auto-merge).

1. Activate skill `/finishing-a-development-branch`:
   - Rebase against `origin/main` (invoke `/resolving-merge-conflicts` if needed).
   - Push feature branch: `git push origin <branch-name>`.
2. Open & Auto-Merge Pull Request / Merge Request:
   - **GitLab (`glab`)**:
     ```bash
     MR_ID=$(glab mr create --title "feat: resolve issue #<id> - <title>" --description "### 📋 Summary\n- 100% tests verified\n- Approved by 3-Agent Committee (Gemini 3.7 + Claude)\nCloses #<id>" --yes | grep -oP '/merge_requests/\K\d+' || echo "")
     if [ -n "$MR_ID" ]; then
       glab mr approve $MR_ID 2>/dev/null || true
       glab mr merge $MR_ID --auto --remove-source-branch --yes 2>/dev/null || glab mr merge $MR_ID --yes 2>/dev/null || true
     fi
     ```
   - **GitHub (`gh`)**:
     ```bash
     gh pr create --title "feat: resolve issue #<id> - <title>" --body "### 📋 Summary\n- 100% tests verified\n- Approved by 3-Agent Committee (Gemini 3.7 + Claude)\nCloses #<id>"
     gh pr review --approve -b "Approved by 3-Agent Committee (Gemini 3.7 + Claude)" 2>/dev/null || true
     gh pr merge --auto --merge --delete-branch 2>/dev/null || true
     ```
3. Auto-Cleanup Worktree & State Sync:
   ```bash
   orca worktree rm --worktree "name:agent/task-<id>" --force --json 2>/dev/null || true
   orca worktree set --worktree active --issue <id> --workspace-status done --comment "MR merged autonomously" --json
   # GitHub: gh issue close <id>
   # GitLab: glab issue close <id>
   ```
- **Completion Criterion**: Feature branch merged into target branch, worktree deleted, issue closed (`done`).

---

## Question & Blocker Handling & Bounded Failure Ladder

### 1. Bounded Failure Ladder (Classify Before Acting)
Never retry blindly in an infinite loop. Always classify the failure type and apply the strict bounded policy:

| Failure Type | Autonomous Action | Budget / Limit |
| :--- | :--- | :--- |
| **Transient transport / runtime network error** | Retry with the exact same configuration. | Max **1 retry**. |
| **Quota, auth, missing tool, or provider down** | **DO NOT repeat unchanged**; failover immediately to an alternate lane in `fleet.json` (e.g. MiniMax-M3 $\rightarrow$ Claude, or Aider $\rightarrow$ MiniMax). | Max **1 reallocation**. |
| **Worker Stall (Unresponsive terminal / loop)** | Probe liveness once with short prompt; if still dead, terminate via `relay-exec` (`process.kill(-pid, "SIGKILL")`) and reallocate. | Max **1 recovery**. |
| **Path / Interface / Shared State collision** | Halt concurrent worker dispatches immediately and serialize execution order. | Immediate serialization. |
| **Malformed completion payload** | Request format-only fix (`run_result.json`) without re-running passed implementation code. | Max **1 format fix**. |
| **Quality / Acceptance failure** | Apply Fix-in-Place ($\le 5$ lines) or bounce back to Coder with targeted error log. | Max **2 bounces**. |
| **Safety / Gate violation** | Halt affected path immediately; never route around gates or bypass checks. | Hard stop & escalate. |

---

### 2. 2-Tier Question & Blocker Hierarchy

- **Tier 1 (Technical / In-Scope Questions)**:
  - Subagent calls:
    ```bash
    orca orchestration ask --to <coordinatorHandle> --question "<question>" --options "optA,optB" --json
    ```
  - Coordinator reads `spec.md` or `CONTEXT.md` and replies via `orca orchestration reply --message <id> --answer "<answer>" --json`.
- **Tier 2 (Business / Missing Credentials / Human Escalation)**:
  > ⚠️ **3-ACTION ESCALATION INVARIANT**: Relabeling alone is not escalation — it's a card sitting silently in a column nobody is watching. Whenever transitioning to `needs-info` for a human decision, the Coordinator MUST perform all three actions atomically, never just one:
  1. Post a comment stating the concrete question, the options considered, and which option the Coordinator leans toward and why:
     ```bash
     gh issue comment <id> --body "### ❓ Clarification Needed for Task #<id>\n<questionnaire>\n\n**Coordinator's lean:** <option> — <one-line reason>"
     # GitLab: glab issue note <id> --message "..."
     ```
  2. Transition label and assign back to the human owner:
     ```bash
     gh issue edit <id> --add-label "needs-info" --remove-label "<old-status>" --add-assignee "<owner>"
     # GitLab: glab issue update <id> --label needs-info --unlabel <old-status> --assignee <owner>
     ```
  3. Send an active notification (not just a passive label change) so the human actually sees it, e.g. via the `PushNotification` tool or equivalent: a one-line "`#<id> blocked: <question>`".
  - `needs-info` means the task is still owned by the Coordinator, waiting on an answer — it is not the same as `ready-for-human` (work handed off for the human to do themselves). Don't conflate the two.

---

## Scheduled Automations Setup (Background Trigger)

To run the full pipeline autonomously in the background:

```bash
orca automations create \
  --name "AutoPilot Autonomous Issue Runner" \
  --trigger "*/3 * * * *" \
  --timezone "Asia/Ho_Chi_Minh" \
  --precheck "gh issue list --repo minhdevtry/orca-plugin --state open --label needs-triage,ready-for-agent --json number -q '.[0].number' | grep -q '^[0-9]'" \
  --prompt "You are Lead Coordinator. Check incoming issues and execute the full 6-stage lifecycle according to /orca-orchestration." \
  --provider claude \
  --repo id:70e65d38-aacf-4e1a-ac05-ec42fa997247 \
  --missed-run-grace-minutes 30 \
  --enabled \
  --json
```

---

## Quick Reference Status Matrix

| Status | Git Label | Orca Board Status | Matt Pocock Skills | Primary Agent |
| :--- | :--- | :--- | :--- | :--- |
| **Triage** | `needs-triage` | `needs-triage` | `/triage`, `/to-spec` | Claude Official (Sonnet 5) |
| **Research** | `needs-info` | `needs-info` | `/research`, `/domain-modeling`, `/to-questionnaire` | Antigravity (`agy` Gemini 3.7) |
| **Ready** | `ready-for-agent` | `ready-for-agent` | `/to-tickets` | Lead Coordinator |
| **Coding** | `in-progress` | `in-progress` | `/implement`, `/tdd`, `/diagnosing-bugs` | MiniMax-M3 |
| **Review** | `ready-for-human` | `ready-for-human` | `/code-review`, `/finishing-a-development-branch` | 3-Agent Committee |
| **Done** | (Closed) | `done` | `/handoff` | Lead Coordinator |
| **Reject** | `wontfix` | `wontfix` | — | Lead Coordinator |
