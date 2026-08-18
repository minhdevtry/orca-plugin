---
name: orca-orchestration
description: End-to-end multi-agent orchestration engine for Orca ADE. Coordinates a 3-agent fleet (Claude Official, MiniMax-M3, Antigravity agy) through 6 lifecycle phases (Triage, Run/Task DAG, Implementation with TDD, Self-Healing Verification, 3-Agent Review Gate, Release PR) with strict 3-tier hierarchy enforcement. Use when orchestrating autonomous tasks, running subagent waves, or executing full-lifecycle issues in Orca ADE.
---

# Orca Multi-Agent Orchestration

Autonomous multi-agent lifecycle coordinator for Orca ADE. Coordinates a specialized 3-agent fleet across Git Worktrees, native Decision Gates, and Matt Pocock skills.

---

## 1. The 3-Agent Fleet & Launch Profiles

Always use these exact launch commands to maintain configuration isolation (`~/.claude-ide`, `~/.gemini/antigravity-cli`):

| Agent | Profile / Model | Strengths & Primary Roles | Launch Command |
| :--- | :--- | :--- | :--- |
| **Claude Official** | Sonnet 5 (Claude Team) | Triage, Spec design, Lead coordination, Spec review | `orca terminal create --worktree "<selector>" --title "Official Claude" --command "unset ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_SMALL_FAST_MODEL CLAUDE_CONFIG_DIR && claude --permission-mode bypassPermissions --dangerously-skip-permissions" --focus --json` |
| **MiniMax-M3** | MiniMax-M3 (Custom Gateway) | High-speed coding, TDD implementation, Syntax/Lint review | `orca terminal create --worktree "<selector>" --title "MiniMax-M3" --command 'export ANTHROPIC_BASE_URL="https://aiapi.2tocom.space" && export ANTHROPIC_API_KEY="sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU" && export ANTHROPIC_MODEL="MiniMax-M3" && export CLAUDE_CONFIG_DIR="$HOME/.claude-ide" && claude --permission-mode bypassPermissions --dangerously-skip-permissions' --focus --json` |
| **Antigravity CLI** | `agy` (Gemini 3.7 Flash High) | Pro/Con Research, Architecture review, `CONTEXT.md` verification | `orca terminal create --worktree "<selector>" --title "worker-agy" --command "agy --model gemini-3.7-flash-high --dangerously-skip-permissions" --focus --json` |

---

## 2. 3-Tier Hierarchy & Non-Proliferation Rules (Depth $\le$ 3)

To prevent infinite subagent recursion or manager deadlock, enforce strict tier bounds:

```
Level 1: Lead Coordinator (Root/Main worktree or Scheduled Automation)
   │
   └── Level 2: Feature Worker (Git Worktree: `agent/task-<id>`)
          │
          └── Level 3: Leaf Helper (Sub-terminal / Split pane in same worktree)
                 └── 🚫 STRICTLY FORBIDDEN from spawning any children (Depth <= 3)
```

- **Level 1 (Lead Coordinator)**: Owns the Run, creates tasks, dispatches to Level 2 workers, controls Decision Gates.
- **Level 2 (Feature Worker)**: Executes `/implement` + `/tdd`. May spawn **at most 1 Level 3 Helper** (`helper-agy` or `helper-m3`) for isolated research or mock data generation.
- **Level 3 (Leaf Helper)**: Pure task helper. **MUST NEVER call `worktree create` or spawn any subagents**. Returns output and idles.

---

## 3. The 6-Phase Execution Lifecycle

```
[Phase 1: /triage & /to-spec] ──> [Phase 2: orca orchestration run & task]
                                                    │
┌───────────────────────────────────────────────────┘
▼
[Phase 3: /implement & /tdd] ──> [Phase 4: Shell npm test (≤3 self-healing loops)]
                                                    │
┌───────────────────────────────────────────────────┘
▼
[Phase 5: Decision Gate & /code-review (3 agents)] ──> [Phase 6: /finishing & PR]
```

### Phase 1: Ingestion & Triage (`needs-triage`)
1. Fetch issue payload: `gh issue view <id> --json number,title,body`.
2. Sync state: `orca worktree set --worktree active --issue <id> --workspace-status needs-triage --comment "Triaging and generating spec" --json`.
3. Activate skills `/triage` and `/to-spec`:
   - Evaluate Consensus, Risk, and Breakthrough angles against `CONTEXT.md`.
   - Write `spec.md` with interfaces, dependencies, and file modification targets.

### Phase 2: Run & Worktree Initialization
1. Create Orchestration Run:
   ```bash
   RUN_ID=$(orca orchestration run-create --objective "Implement task #<id>: <title>" --json | jq -r .result.run.id)
   ```
2. Create Orchestration Task:
   ```bash
   TASK_ID=$(orca orchestration task-create --spec "Implement feature according to spec.md" --task-title "Task #<id>" --json | jq -r .result.task.id)
   ```
3. Spawn isolated Worktree:
   ```bash
   orca worktree create --name "agent/task-<id>" --setup run --json
   ```

### Phase 3: Worker Dispatch & TDD Implementation (`in-progress`)
1. Launch Coder terminal (MiniMax-M3) in `agent/task-<id>` using Profile B, capturing `<childHandle>`.
2. Sync state: `orca worktree set --worktree "name:agent/task-<id>" --issue <id> --workspace-status in-progress --comment "MiniMax-M3 implementing with TDD" --json` and `gh issue edit <id> --add-label "in-progress" --remove-label "needs-triage,ready-for-agent"`.
3. Dispatch task with prompt injection:
   ```bash
   orca orchestration dispatch --task $TASK_ID --to <childHandle> --inject --json
   orca terminal send --terminal <childHandle> \
     --text "Task: /implement task #<id>. Follow spec.md and CONTEXT.md. Apply /tdd (Red-Green-Refactor). Make atomic commits." \
     --enter --json
   ```
4. Coordinator waits for worker turn completion:
   ```bash
   orca terminal wait --terminal <childHandle> --for tui-idle --timeout-ms 600000 --json
   ```

### Phase 4: Shell Test Verification & Self-Healing Loop
> ⚠️ **RULE (Evidence Before Assertions)**: Never accept an agent's self-claim of passing tests. The Coordinator MUST execute the shell test command directly.

1. Execute test suite in child worktree:
   ```bash
   cd /home/minhdn3/orca/workspaces/orca-dhs/agent-task-<id> && npm test
   ```
2. **If Exit Code = 0 (PASS)**: Advance immediately to Phase 5.
3. **If Exit Code != 0 (FAIL)**:
   - Check retry budget: Max **3 iterations** (`retryCount <= 3`).
   - Log retry: `orca orchestration task-update --id $TASK_ID --status in-progress --result '{"retryCount": 1, "state": "healing-test-failures"}' --json`.
   - Send failure output to Coder agent with skill `/diagnosing-bugs`:
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

### Phase 5: Tripartite Review Committee & Decision Gate
1. Lock task with Decision Gate:
   ```bash
   GATE_ID=$(orca orchestration gate-create --task $TASK_ID --question "Does the 3-agent committee approve task #<id>?" --options '["yes","no"]' --json | jq -r .result.gate.id)
   ```
2. Execute 2-Axis `/code-review` across parallel agents:
   - **Axis 1 (Standards)** via **MiniMax-M3**: Strict TypeScript types, lint, formatting, typos, smell baseline.
   - **Axis 2 (Architecture & Spec)** via **Antigravity CLI**: Module boundaries, `CONTEXT.md` adherence, filtering false positives.
   - **Axis 3 (Spec Match)** via **Claude Official**: Verification against `spec.md`.
3. Gate Resolution:
   - When approved: `orca orchestration gate-resolve --id $GATE_ID --resolution "yes" --json`.
   - Cleanup worker terminal: `orca orchestration worker-release --dispatch <dispatchId> --json`.

### Phase 6: Release, Rebase & PR Synchronization (`ready-for-human`)
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
3. Final status sync:
   ```bash
   orca worktree set --worktree active --issue <id> --workspace-status ready-for-human --comment "PR opened, ready for human review" --json
   gh issue edit <id> --add-label "ready-for-human" --remove-label "in-progress"
   ```
4. Open Orca Diff Viewer for human inspection:
   ```bash
   orca file open-changed --mode diff --worktree "name:agent/task-<id>" --json
   ```

---

## 4. Question & Blocker Handling (2-Tier Hierarchy)

When a subagent encounters a blocker:

- **Tier 1 (Technical / In-Scope Questions)**:
  - Subagent calls:
    ```bash
    orca orchestration ask --to <coordinatorHandle> --question "<question>" --options "optA,optB" --json
    ```
  - Coordinator reads `spec.md` or `CONTEXT.md` and replies via `orca orchestration reply --message <id> --answer "<answer>" --json`.
- **Tier 2 (Business / Missing Secrets / Human Escalation)**:
  - Coordinator activates skill `/to-questionnaire` to format a structured multiple-choice prompt.
  - Coordinator sets `needs-info` status and posts comment to GitHub:
    ```bash
    gh issue comment <id> --body "### ❓ Clarification Needed for Task #<id>\n<questionnaire>"
    ```

---

## 5. Scheduled Automations (AFK Background Trigger)

To run the pipeline continuously in the background:

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

## 6. Status & Skill Mapping Reference

| Status | Git Label | Orca Board Status | Activated Skills | Primary Agent |
| :--- | :--- | :--- | :--- | :--- |
| **Triage** | `needs-triage` | `needs-triage` | `/triage`, `/to-spec` | Claude Official (Sonnet 5) |
| **Research** | `needs-info` | `needs-info` | `/research`, `/domain-modeling`, `/to-questionnaire` | Antigravity (`agy` Gemini 3.7) |
| **Ready** | `ready-for-agent` | `ready-for-agent` | `/to-tickets` | Lead Coordinator |
| **Coding** | `in-progress` | `in-progress` | `/implement`, `/tdd`, `/diagnosing-bugs` | MiniMax-M3 |
| **Review** | `ready-for-human` | `ready-for-human` | `/code-review`, `/finishing-a-development-branch` | 3-Agent Committee |
| **Done** | (Closed) | `done` | `/handoff` | Lead Coordinator |
| **Reject** | `wontfix` | `wontfix` | — | Lead Coordinator |
