---
name: orca-orchestration
description: Use when orchestrating autonomous tasks across multiple agents in Orca ADE, handling issues from triage to merge, dispatching workers into isolated worktrees, or managing multi-agent runs
---

# Orca Multi-Agent Orchestration

## Overview
Autonomous multi-agent orchestration engine for Orca ADE. Coordinates a specialized 3-agent fleet across isolated Git Worktrees, native Decision Gates, and strict event-driven callbacks with self-healing invariants.

---

## When to Use
**Use this skill when:**
- Orchestrating tasks autonomously across multiple specialized agents in Orca ADE.
- Managing an issue from triage through spec, implementation, review, and merge.
- Dispatching subagents in isolated Git Worktrees with supervised worker contracts.
- Automating background task intake via Orca Scheduled Automations.

**Do NOT use when:**
- Performing a quick single-file edit in the current workspace (use direct file editing).
- Running a simple local one-off command without agent coordination.

---

## Quick Reference: 6-Stage Lifecycle & 3-Tier Fleet

### 1. Fleet Matrix
| Role | Agent Profile | Primary Focus | Canonical Launch Binary |
| :--- | :--- | :--- | :--- |
| **Coordinator** | Claude Official (Sonnet 5) | Triage, Spec, Gatekeeper, Auto-Merge | `claude` (Profile A) |
| **Fast Coder** | MiniMax-M3 (Custom Gateway) | Rapid TDD implementation, syntax review | `claude-m3` (Profile B) |
| **Deep Research** | Antigravity (Gemini 3.7 Flash) | Architecture audit, Blind MR Review | `agy` (Profile C) |

### 2. Hard Cap Hierarchy (Max Depth = 3)
```
Level 1: Lead Coordinator (Root workspace / Main branch)
   └── Level 2: Feature Worker (Git Worktree: agent/task-<id>)
          └── Level 3: Leaf Helper (Split pane helper in same worktree)
                 └── 🚫 STRICT PROHIBITION: NEVER spawn children (Depth <= 3)
```

---

## State Alignment & Desync Healing Rule

> 🔄 **State Healing Invariant**: If a user drags a card on the Orca UI to the wrong column, the agent always treats the **GitHub/GitLab Issue Label as the authoritative truth** and automatically reconciles the Orca Workspace Board:
> ```bash
> ~/.local/bin/orca worktree set --worktree "<selector>" --workspace-status <authoritativeLabel> --json
> ```

---

## Core Lifecycle Execution

### Phase 1: Intake, Triage & Assurance Branching
1. Retrieve issue payload:
   ```bash
   gh issue view <id> --json number,title,body,labels || glab issue view <id>
   ```
2. Classify **Assurance Level**:
   - **`Fast` Track** (Typo, docs, $\le 5$ lines): Coordinator edits directly in root workspace $\rightarrow$ runs `npm test` $\rightarrow$ commits/pushes $\rightarrow$ closes issue. (Skips Worktree, Phase 3 & 6).
   - **`Standard` Track** (Bugfix, isolated module): Worktree $\rightarrow$ MiniMax-M3 TDD $\rightarrow$ Unit tests $\rightarrow$ 2-axis Review $\rightarrow$ Auto-Merge.
   - **`Full` Track** (Core architecture, API changes): Worktree $\rightarrow$ 9 API Gates $\rightarrow$ Full Gauntlet $\rightarrow$ Blind Review Gate $\rightarrow$ Pre-Merge Check $\rightarrow$ Auto-Merge.
3. For API changes on Full track, verify against [9 API Design Gates](references/api-design-gates.md).

---

### Phase 2: Run & Worktree Initialization
1. Create native Run & Task:
   ```bash
   RUN_ID=$(~/.local/bin/orca orchestration run-create --objective "Implement task #<id>" --json | jq -r .result.run.id)
   TASK_ID=$(~/.local/bin/orca orchestration task-create --spec "Implement per spec.md" --task-title "Task #<id>" --json | jq -r .result.task.id)
   ```
2. Create isolated Git Worktree:
   ```bash
   ~/.local/bin/orca worktree create --name "agent/task-<id>" --setup run --json
   ```

---

### Phase 3: Non-Blocking Dispatch & Safety Capsule
1. Launch Coder terminal (MiniMax-M3) in `agent/task-<id>`.
2. Update status to `in-progress`:
   ```bash
   ~/.local/bin/orca worktree set --worktree "name:agent/task-<id>" --issue <id> --workspace-status in-progress --json
   gh issue edit <id> --add-label "in-progress" --remove-label "needs-triage,ready-for-agent"
   ```
3. Dispatch task with **Worker Safety Capsule & Event Callback**:
   ```bash
   COORDINATOR_HANDLE=$(~/.local/bin/orca terminal list --json 2>/dev/null | jq -r '.[0].id // "active"')
   ~/.local/bin/orca terminal send --terminal <childHandle> \
     --text "Task: /implement task #<id>
=== 🛡️ WORKER SAFETY CAPSULE ===
ROLE: Finite implementation worker (Depth <= 3).
OBJECTIVE: Implement task #<id> strictly per spec.md using /tdd.
AUTHORITY: Read/write only assigned module files.
CALLBACK ON COMPLETION:
  When implementation and tests pass, send completion signal back to Coordinator:
  ~/.local/bin/orca terminal send --terminal \"$COORDINATOR_HANDLE\" --text \"Task #<id> completed by worker. Triggering Phase 4 verification.\" --enter
================================" --enter --json
   ```
4. ⚡ **Strict Non-Blocking Rule**: Coordinator prints dispatch notice and **YIELDS THE TURN IMMEDIATELY** (no `terminal wait`, no sleeping loops).

---

### Phase 4: Shell Verification & Multi-Layer Gauntlet
> ⚠️ **Evidence Before Assertions**: Never accept an agent's self-claim of passing tests. The Coordinator MUST execute shell verification directly.

```bash
cd ~/orca/workspaces/<repo>/agent-task-<id>
# Standard Track:
npm test
# Full Track (Gauntlet):
./scripts/run-gauntlet.sh .
```
- If test fails $\le 5$ lines (typo, import): Lead Coordinator fixes directly in place.
- If test fails > 5 lines: Bounce back to worker (Max 2 times, follow [Bounded Failure Ladder](references/failure-ladder.md)).

---

### Phase 5: Blind Adversarial Review Gate
For Full Track, launch **Antigravity CLI (Gemini 3.7 Flash High)** in independent session with ONLY 4 inputs (no chat history of Coder):
1. Original Issue Description.
2. Approved `spec.md`.
3. Worktree Git Diff (`git diff origin/main...HEAD`).
4. Gauntlet output report.

---

### Phase 6: Release & Autonomous Merge
1. Run pre-merge forbidden path check:
   ```bash
   node scripts/verify-premerge.mjs origin/main
   ```
2. Commit and push:
   ```bash
   git commit -m "feat: implement task #<id> [skip ci]"
   git push origin agent/task-<id>
   ```
3. Open MR/PR & Auto-Merge:
   ```bash
   gh pr create --title "feat: task #<id>" --body "Automated MR approved by 3-Agent Committee."
   gh pr merge --auto --squash --delete-branch
   ```
4. Close Task, Run, and clean up Worktree:
   ```bash
   ~/.local/bin/orca orchestration task-close --task $TASK_ID --json
   ~/.local/bin/orca worktree rm --worktree "name:agent/task-<id>" --force --json
   ```

---

## Common Rationalizations & Red Flags

### Rationalization Table
| Excuse / Rationalization | Reality / Enforced Rule |
| :--- | :--- |
| *"I'll wait with `orca terminal wait` so I know when it's done"* | 🚫 **FORBIDDEN**: Freezes Coordinator for 10+ mins, burns thousands of tokens. Use Non-Blocking Dispatch + Event Callback. |
| *"Worker self-reported 100% tests passed, so I can merge"* | 🚫 **FORBIDDEN**: Evidence before assertions. Coordinator MUST run `npm test` or `run-gauntlet.sh` directly. |
| *"I'll do a quick fix directly on main branch without worktree"* | 🚫 **FORBIDDEN**: Only `Fast` track ($\le 5$ lines) is permitted on root. Standard and Full MUST use isolated worktrees. |
| *"Worker can spawn sub-workers who spawn more workers"* | 🚫 **FORBIDDEN**: Hard cap max depth = 3. Leaf helpers cannot spawn children. |
| *"Merge directly even if forbiddenPaths check fails"* | 🚫 **FORBIDDEN**: Any forbidden path change requires human approval. Escalate to `needs-info`. |

### 🚩 Red Flags - STOP and Start Over
- Running `orca terminal wait` or `timeout 500+` in Lead Coordinator session.
- Trusting worker's self-claim without running test commands directly.
- Editing CI/CD workflows, `.env` files, or production secrets autonomously.
- Spawning beyond Depth Level 3.

---

## Reference Documents
- [9 API Design Gates](references/api-design-gates.md)
- [7-Step Bounded Failure Ladder](references/failure-ladder.md)
- [Worker Safety Capsule Contract](references/safety-capsule.md)
