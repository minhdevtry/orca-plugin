---
name: orca-orchestration
description: Use when orchestrating autonomous tasks, running subagent waves, coordinating multi-agent runs, or executing full-lifecycle issues in Orca ADE.
---

# Orca Multi-Agent Orchestration

## Overview
End-to-end multi-agent orchestration engine for Orca ADE. Coordinates a 3-agent fleet across isolated Git Worktrees, native Decision Gates, and Matt Pocock skills with deterministic self-healing loops and strict 3-tier hierarchy enforcement.

### ⚠️ CLI Executable Resolution
Always use the proper Orca binary path:
- On Linux outside an Orca-managed terminal, use `~/.local/bin/orca` or `orca-ide`.
- **Never run bare `/usr/bin/orca`** (which starts the GNOME Screen Reader).
- To inspect dynamic CLI flags supported by your current Orca build: `~/.local/bin/orca skills get orchestration --full`.

---

## When to Use
Use this skill when:
- Orchestrating tasks autonomously across multiple specialized agents in Orca ADE.
- Managing an issue from triage through spec, implementation, review, and release.
- Dispatching subagents in isolated Git Worktrees with supervised worker contracts.
- Setting up Orca Scheduled Automations for background task ingestion.

Do NOT use when:
- Performing a quick single-file edit in the current workspace (use direct editing instead).
- Running a simple local test or one-off shell command.

---

## Architecture & Fleet Matrix

### Specialized Agent Profiles

| Role | Profile & Model | Primary Responsibilities | Canonical Launch Command |
| :--- | :--- | :--- | :--- |
| **Coordinator / Spec** | Claude Official (Sonnet 5) | Triage, Spec design, Gate supervision, PR release | `~/.local/bin/orca terminal create --worktree "<selector>" --title "Official Claude" --command "claude --permission-mode bypassPermissions --dangerously-skip-permissions" --focus --json` |
| **Coder / TDD** | MiniMax-M3 (Custom Gateway) | High-throughput coding, Unit test TDD, Syntax review | `~/.local/bin/orca terminal create --worktree "<selector>" --title "MiniMax-M3" --command "claude-m3 --permission-mode bypassPermissions --dangerously-skip-permissions" --focus --json` |
| **Architect / Research** | Antigravity CLI (`agy` Gemini 3.7 Flash) | Pro/Con technical research, `CONTEXT.md` architecture review | `~/.local/bin/orca terminal create --worktree "<selector>" --title "worker-agy" --command "agy --model gemini-3.7-flash-high --dangerously-skip-permissions" --focus --json` |

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
  ~/.local/bin/orca worktree set --worktree active --issue <id> --workspace-status "$REMOTE_LABEL" \
    --comment "State-heal: aligned Orca workspace card with GitHub label [$REMOTE_LABEL]" --json
fi
```

### 🔒 Atomic Dual-Update Invariant:
When advancing through the 6-stage lifecycle, the Agent MUST ALWAYS execute status updates as a paired atomic operation:
1. `gh issue edit <id> --add-label "<new-status>" --remove-label "<old-status>"`
2. `~/.local/bin/orca worktree set --worktree "<worktree-selector>" --issue <id> --workspace-status "<new-status>" --json`

---

## Step-by-Step Execution Process

```
[Phase 1: Triage & Assurance Selection]
    │
    ├── (Fast: Minor <= 5 lines) ──> [Direct Root Fix & Commit] ──> [Done]
    │
    └── (Standard / Full) ──> [Phase 2: Orca Run & Worktree Init]
                                        │
                                        ▼
                              [Phase 3: Worker Dispatch & TDD]
                                        │
                                        ▼
                              [Phase 4: Shell Verification / Gauntlet]
                                        │
                                        ▼
                              [Phase 5: Decision Gate & Review]
                                        │
                                        ▼
                              [Phase 6: Release PR & Auto-Merge]
```

---

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
   ~/.local/bin/orca worktree set --worktree active --issue <id> --workspace-status needs-triage --comment "Triaging and analyzing scope" --json
   # GitHub: gh issue edit <id> --add-label "needs-triage"
   # GitLab: glab issue update <id> --label "needs-triage"
   ```
3. Classify **Assurance Level**:
   - **`Fast` (Minor Fix / Typo / $\le 5$ lines)**:
     - **Direct Execution Flow**: Do NOT create a Git Worktree.
     - The Coordinator directly applies the edit in the root workspace, runs `npm test`.
     - If passing, commits directly: `git commit -am "fix: <title>" && git push origin main`.
     - Closes issue (`gh issue close <id>` / `glab issue close <id>`) and sets card to `done`.
     - *End of lifecycle for Fast track.*
   - **`Standard` (Material Feature / Bugfix)**:
     - Standard isolated worktree flow. Proceeds to Phase 2 $\rightarrow$ Phase 3 (MiniMax-M3 TDD) $\rightarrow$ Phase 4 (`npm test`) $\rightarrow$ Phase 5 (2-Axis Review) $\rightarrow$ Phase 6 (Auto-Merge).
   - **`Full` (Sensitive / Core Architecture / Payment API)**:
     - High-rigor isolated flow. Enforces 9 API Design Gates in `spec.md`, Phase 3 TDD with Negative Control evidence, Phase 4 Full Gauntlet (`scripts/run-gauntlet.sh`), Phase 5 Blind Adversarial Review Gate, and Phase 6 Pre-Merge check (`scripts/verify-premerge.mjs`).

4. Analyze Issue & Branching Decision (for Standard / Full):
   - **Branch A: Clear & Actionable** ➔ Invoke `/triage` and `/to-spec`.
     - Write `spec.md` with explicit module interfaces, dependencies, and file modification targets.
     - **9 API Design Gates (`old-coder-api`)** (Mandatory for Full track / Backend APIs):
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
       ~/.local/bin/orca worktree set --worktree active --issue <id> --workspace-status ready-for-agent --comment "Spec approved, ready for implementation" --json
       # GitHub: gh issue edit <id> --add-label "ready-for-agent" --remove-label "needs-triage"
       # GitLab: glab issue update <id> --label "ready-for-agent" --unlabel "needs-triage"
       ```
       Proceed directly to Phase 2.
   - **Branch B: Missing Information / Questions / Ambiguity** ➔ Invoke `/to-questionnaire`. Format structured multiple-choice questions, transition label to `needs-info`, and post questions as a comment on the issue:
     ```bash
     ~/.local/bin/orca worktree set --worktree active --issue <id> --workspace-status needs-info --comment "Waiting for human input on requirements" --json
     # GitHub: gh issue edit <id> --add-label "needs-info" --remove-label "needs-triage" && gh issue comment <id> --body "<questionnaire>"
     # GitLab: glab issue update <id> --label "needs-info" --unlabel "needs-triage" && glab issue note <id> --message "<questionnaire>"
     ```
     Yield turn to wait for human reply on GitHub/GitLab. **DO NOT freeze in an interactive shell loop**.

---

### Phase 2: Run & Worktree Initialization
1. Create native Orchestration Run:
   ```bash
   RUN_ID=$(~/.local/bin/orca orchestration run-create --objective "Implement task #<id>: <title>" --json | jq -r .result.run.id)
   ```
2. Create native Orchestration Task:
   ```bash
   TASK_ID=$(~/.local/bin/orca orchestration task-create --spec "Implement feature according to spec.md" --task-title "Task #<id>" --json | jq -r .result.task.id)
   ```
3. Create isolated Git Worktree:
   ```bash
   ~/.local/bin/orca worktree create --name "agent/task-<id>" --setup run --json
   ```
- **Completion Criterion**: Worktree created at `~/orca/workspaces/<repo>/agent-task-<id>` with active branch.

---

### Phase 3: Worker Dispatch & Worker Safety Capsule
1. Launch Coder terminal (MiniMax-M3) in `agent/task-<id>` using Profile B, capturing `<childHandle>`.
2. Synchronize status:
   ```bash
   ~/.local/bin/orca worktree set --worktree "name:agent/task-<id>" --issue <id> --workspace-status in-progress --comment "MiniMax-M3 implementing with TDD" --json
   # GitHub: gh issue edit <id> --add-label "in-progress" --remove-label "needs-triage,ready-for-agent"
   # GitLab: glab issue update <id> --label "in-progress" --unlabel "needs-triage,ready-for-agent"
   ```
3. Inject **Worker Safety Capsule Contract** into dispatch prompt:
   ```bash
   ~/.local/bin/orca orchestration dispatch --task $TASK_ID --to <childHandle> --inject --json
   ~/.local/bin/orca terminal send --terminal <childHandle> \
     --text "Task: /implement task #<id>
=== 🛡️ WORKER SAFETY CAPSULE ===
ROLE: Finite implementation worker (STRICTLY FORBIDDEN from starting sub-orchestration, Depth <= 3).
OBJECTIVE: Implement task #<id> strictly per spec.md and CONTEXT.md using /tdd.
EXCLUSIONS: Do NOT touch files outside targeted module; do NOT change project configs.
AUTHORITY:
  - Exact Read Paths: [spec.md, CONTEXT.md, targeted source and test files]
  - Exact Write Paths: [targeted source files, targeted test files]
  - External Side Effects: NONE (no network mutation, no external publishing)
SAFETY BOUNDARY:
  - Never bypass test gates or expose credentials.
================================" \
     --enter --json
   ```
   *(For watchdog execution with process-tree isolation: `node scripts/relay-exec.mjs fast-coder 900000 run_result.json -p "Task: /implement task #<id>"`)*

4. **Supervised Execution Modes**:
   - **Autonomous Mode (Default)**: Probe in short 15-second intervals via `~/.local/bin/orca orchestration check --types worker_done --timeout-ms 15000 --json`. Cap probing at 40 iterations (~10 minutes) per attempt.
   - **Interactive Mode**: If started manually by human, report status and yield.
- **Completion Criterion**: Subagent finishes implementation and worktree is ready for verification.

---

### Phase 4: Shell Verification & Multi-Layer Gauntlet

> ⚠️ **MANDATORY INVARIANT (Evidence Before Assertions)**: Never accept an agent's self-claim of passing tests. The Coordinator MUST execute the shell verification directly.

1. Execute test suite / Gauntlet directly in child worktree:
   ```bash
   cd ~/orca/workspaces/<repo>/agent-task-<id>
   # Standard Track:
   npm test
   # Full Track:
   ./scripts/run-gauntlet.sh .
   ```
2. **If Exit Code = 0 (PASS)**: Advance directly to Phase 5.
3. **If Exit Code != 0 (FAIL)**:
   - **Case A: Minor Failure (Fix-in-Place Rule)**: If the failure is minor (lint, formatting, typo, small $\le 5$ line bug, or missing catch block), the **Coordinator MUST fix it directly in the worktree** and re-run `npm test`. **DO NOT bounce back to the worker for trivial fixes** (saving massive tokens and eliminating 10-minute wait cycles).
   - **Case B: Major Architectural Failure (Max 2 Bounces)**: If fundamental logic is broken:
     ```bash
     ~/.local/bin/orca terminal send --terminal <childHandle> \
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
   GATE_ID=$(~/.local/bin/orca orchestration gate-create --task $TASK_ID --question "Does the 3-agent committee approve task #<id>?" --options '["yes","no"]' --json | jq -r .result.gate.id)
   ```
2. **Review Verification**:
   - **Standard Track (2-Axis Review)**:
     - Axis 1 (Standards) via MiniMax-M3: TypeScript types, lint, formatting.
     - Axis 2 (Spec Compliance) via Claude Official: Verification against `spec.md`.
   - **Full Track (3-Agent Blind Adversarial Review)**:
     - Antigravity CLI (Gemini 3.7 Flash High) is fed **ONLY 4 pure inputs** to avoid confirmation bias:
       1. Issue Requirements (`gh issue view <id>` / `glab issue view <id>`).
       2. Approved `spec.md`.
       3. Current Worktree Git Commit SHA.
       4. Gauntlet Execution Output (`scripts/run-gauntlet.sh`).
     - Executed safely via Read-Only Tripwire: `./scripts/safe-research.sh ~/orca/workspaces/<repo>/agent-task-<id>`
3. **Review Finding Remediation**:
   - **Minor Issues ($\le 5$ lines)**: Coordinator applies quick fixes directly in-place.
   - **Major Violations**: Reject gate and request targeted worker rewrite.
4. Resolve Gate & Cleanup:
   ```bash
   ~/.local/bin/orca orchestration gate-resolve --id $GATE_ID --resolution "yes" --json
   ~/.local/bin/orca orchestration worker-release --dispatch <dispatchId> --json
   ```
- **Completion Criterion**: Decision Gate resolved with `"yes"`.

---

### Phase 6: Release, Rebase & Autonomous Auto-Merge MR/PR
> 🚀 **AUTONOMOUS MERGE INVARIANT**: Once Gemini 3.7 (`agy`) and the 3-Agent Committee approve the review and all unit tests pass, the Coordinator automatically creates, approves, and MERGES the MR/PR and tears down the worktree.

0. **Forbidden-Paths Pre-Merge Check**:
   Before creating the PR/MR, execute the automated pre-merge checker:
   ```bash
   cd ~/orca/workspaces/<repo>/agent-task-<id> && node scripts/verify-premerge.mjs origin/main
   ```
   If it exits with code 1 (diff touches forbidden paths like `.github/workflows/`, secrets, `.env`), **do NOT auto-merge** — transition to `needs-info` and escalate to human.

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
   ~/.local/bin/orca worktree rm --worktree "name:agent/task-<id>" --force --json 2>/dev/null || true
   ~/.local/bin/orca worktree set --worktree active --issue <id> --workspace-status done --comment "MR merged autonomously" --json
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
| **Quota, auth, missing tool, or provider down** | **DO NOT repeat unchanged**; failover immediately to an alternate lane in `fleet.json` (e.g. MiniMax-M3 $\rightarrow$ Claude). | Max **1 reallocation**. |
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
    ~/.local/bin/orca orchestration ask --to <coordinatorHandle> --question "<question>" --options "optA,optB" --json
    ```
  - Coordinator reads `spec.md` or `CONTEXT.md` and replies via `~/.local/bin/orca orchestration reply --message <id> --answer "<answer>" --json`.
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
