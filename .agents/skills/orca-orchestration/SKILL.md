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

### Phase 1: Ingestion & Triage
1. Fetch issue payload:
   ```bash
   gh issue view <id> --json number,title,body
   ```
2. Synchronize workspace card status:
   ```bash
   orca worktree set --worktree active --issue <id> --workspace-status needs-triage --comment "Triaging and generating spec" --json
   gh issue edit <id> --add-label "needs-triage"
   ```
3. Invoke `/triage` and `/to-spec` skills:
   - Analyze Consensus, Risk, and Breakthrough perspectives against `CONTEXT.md`.
   - Write `spec.md` with explicit module interfaces, dependencies, and file modification targets.
- **Completion Criterion**: `spec.md` exists and card is labeled `ready-for-agent`.

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

### Phase 3: Worker Dispatch & TDD Implementation
1. Launch Coder terminal (MiniMax-M3) in `agent/task-<id>` using Profile B, capturing `<childHandle>`.
2. Synchronize status:
   ```bash
   orca worktree set --worktree "name:agent/task-<id>" --issue <id> --workspace-status in-progress --comment "MiniMax-M3 implementing with TDD" --json
   gh issue edit <id> --add-label "in-progress" --remove-label "needs-triage,ready-for-agent"
   ```
3. Dispatch task with preamble and instructions:
   ```bash
   orca orchestration dispatch --task $TASK_ID --to <childHandle> --inject --json
   orca terminal send --terminal <childHandle> \
     --text "Task: /implement task #<id>. Follow spec.md and CONTEXT.md. Apply /tdd (Red-Green-Refactor). Make atomic commits." \
     --enter --json
   ```
4. Wait for worker turn completion:
   ```bash
   orca terminal wait --terminal <childHandle> --for tui-idle --timeout-ms 600000 --json
   ```
- **Completion Criterion**: Subagent terminal reaches `tui-idle` state.

---

### Phase 4: Shell Verification & Self-Healing Loop
> ⚠️ **MANDATORY INVARIANT (Evidence Before Assertions)**: Never accept an agent's self-claim of passing tests. The Coordinator MUST execute the shell test command directly.

1. Execute test suite directly in child worktree:
   ```bash
   cd /home/minhdn3/orca/workspaces/<repo>/agent-task-<id> && npm test
   ```
2. **If Exit Code = 0 (PASS)**: Advance directly to Phase 5.
3. **If Exit Code != 0 (FAIL)**:
   - Check retry counter: Max **3 iterations** (`retryCount <= 3`).
   - Record retry: `orca orchestration task-update --id $TASK_ID --status in-progress --result '{"retryCount": 1, "state": "healing-test-failures"}' --json`.
   - Send failure logs to Coder agent with `/diagnosing-bugs`:
     ```bash
     orca terminal send --terminal <childHandle> \
       --text "Tests failed with errors: <error_log>. Activate /diagnosing-bugs and fix the implementation until npm test passes." \
       --enter --json
     orca terminal wait --terminal <childHandle> --for tui-idle --timeout-ms 300000 --json
     ```
   - **If still failing after 3 attempts**:
     - Set status: `orca worktree set --worktree active --workspace-status needs-info --comment "Failed tests after 3 self-healing loops" --json`.
     - Transition label: `gh issue edit <id> --add-label "needs-info" --remove-label "in-progress"`.
     - Escalate to human.
- **Completion Criterion**: `npm test` exit code is 0 in the child worktree.

---

### Phase 5: Tripartite Review Committee & Decision Gate
1. Lock task with native Decision Gate:
   ```bash
   GATE_ID=$(orca orchestration gate-create --task $TASK_ID --question "Does the 3-agent committee approve task #<id>?" --options '["yes","no"]' --json | jq -r .result.gate.id)
   ```
2. Execute 2-Axis `/code-review` across parallel agents:
   - **Axis 1 (Standards)** via **MiniMax-M3**: TypeScript types, lint, formatting, typos, smell baseline.
   - **Axis 2 (Architecture & Spec)** via **Antigravity CLI**: Module boundaries, `CONTEXT.md` adherence, filtering false positives.
   - **Axis 3 (Spec Compliance)** via **Claude Official**: Verification against `spec.md`.
3. Resolve Gate & Cleanup:
   ```bash
   orca orchestration gate-resolve --id $GATE_ID --resolution "yes" --json
   orca orchestration worker-release --dispatch <dispatchId> --json
   ```
- **Completion Criterion**: Decision Gate resolved with `"yes"`.

---

### Phase 6: Release, Rebase & PR Synchronization
1. Activate skill `/finishing-a-development-branch`:
   - Check rebase against `origin/main` (invoke `/resolving-merge-conflicts` if needed).
   - Push feature branch: `git push origin minhdevtry/agent-task-<id>`.
2. Open Pull Request:
   ```bash
   gh pr create --title "feat: resolve issue #<id> - <title>" \
     --body "### 📋 Summary
- Spec compliance verified via \`/to-spec\`.
- 100% Unit Tests verified via \`/tdd\`.
- Approved by 3-Agent Review Committee (MiniMax-M3 + Antigravity + Claude).
Closes #<id>"
   ```
3. Synchronize status:
   ```bash
   orca worktree set --worktree active --issue <id> --workspace-status ready-for-human --comment "PR opened, ready for human review" --json
   gh issue edit <id> --add-label "ready-for-human" --remove-label "in-progress"
   ```
4. Open Orca Diff Viewer for human review:
   ```bash
   orca file open-changed --mode diff --worktree "name:agent/task-<id>" --json
   ```
- **Completion Criterion**: PR opened and Diff Viewer displayed.

---

## Question & Blocker Handling (2-Tier Hierarchy)

- **Tier 1 (Technical / In-Scope Questions)**:
  - Subagent calls:
    ```bash
    orca orchestration ask --to <coordinatorHandle> --question "<question>" --options "optA,optB" --json
    ```
  - Coordinator reads `spec.md` or `CONTEXT.md` and replies via `orca orchestration reply --message <id> --answer "<answer>" --json`.
- **Tier 2 (Business / Missing Credentials / Human Escalation)**:
  - Coordinator activates skill `/to-questionnaire` to format a structured multiple-choice prompt.
  - Coordinator transitions status to `needs-info` and posts comment to GitHub issue:
    ```bash
    gh issue comment <id> --body "### ❓ Clarification Needed for Task #<id>\n<questionnaire>"
    ```

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
