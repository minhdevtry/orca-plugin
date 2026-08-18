# Orca AutoPilot Plugin & Fleet Context

## Overview
**Orca AutoPilot Plugin** is an autonomous multi-agent engineering platform and interactive Kanban board integrated natively into **Orca ADE** (Autonomous Development Environment).

## Key Components

### 1. `orca-autopilot-plugin/`
- **`orca-plugin.json`**: Plugin manifest defining sidebar panel (`autopilot-kanban`), capabilities (`terminal.write`, `notifications.show`, `storage.readwrite`, `workspace.read`), and event subscriptions (`agent.status.changed`, `worktree.created`, `worktree.removed`).
- **`panel/index.html`**: Native Kanban board UI rendered inside Orca's right sidebar. Inherits host CSS design tokens (`--background`, `--foreground`, `--card`, `--primary`, `--border`) and communicates via `window.parent.postMessage`.
- **`main.mjs`**: Out-of-process Node.js background worker managed by Orca's `PluginWorkerManager`.
- **`lib/pipeline-orchestrator.mjs`**: 4-agent state machine orchestrating the full autonomous lifecycle:
  - `Stage 1: Spec Agent` (`/to-spec`, `/to-tickets`) $\rightarrow$ generates `spec.md`.
  - `Stage 2: Coder Agent` (`/implement`, `/tdd`) $\rightarrow$ codes and tests in an isolated Git Worktree.
  - `Stage 3: Reviewer Agent` (`/code-review`, `/diagnosing-bugs`) $\rightarrow$ dual-axis verification (Standards + Spec) with self-healing ($\le 3$ retries).
  - `Stage 4: Release Agent` (`/finishing-a-development-branch`, `/resolving-merge-conflicts`) $\rightarrow$ creates GitHub/GitLab Pull Request.
- **`lib/github-gitlab-adapter.mjs`**: CLI integration layer for `gh` and `glab`.

### 2. Skills Integration
- **`mattpocock/skills`** (35 skills in `.agents/skills/`): Engineering workflow, triage state machine (`needs-triage`, `needs-info`, `ready-for-agent`, `in-progress`, `ready-for-human`, `done`), TDD, code review, refactoring, and domain modeling.
- **`stablyai/orca` (`orchestration` skill)**: Native Orca orchestration protocol (`orca orchestration task-create`, `dispatch --inject`, `check --wait`, `worker_done`, `worker-release`). Updated via `npx -y skills update orchestration --global -y`.

### 3. Orca Host Integrations
- **Git Worktree Lifecycle**: Handled by Orca (`src/main/git/worktree.ts`) via `orca worktree create` and `orca worktree remove`.
- **Realtime Event Bus**: Subscribed to `agent.status.changed` emitted by Orca `agentHookServer`.
- **Dual Notification Relay**: Dispatched via `notifications.show` simultaneously to Desktop PC and paired **Orca Mobile** devices.
- **In-IDE Diff Inspection**: Triggered via `orca file open-changed --mode diff`.
- **Browser CDP Verification**: Native Chrome DevTools Protocol engine (`orca snapshot`, `orca click`, `orca eval`).

## Status-Based Agent & Subagent Dispatching Matrix

| Stage | Primary Agent | Model | Subagents & Delegation Strategy | Next Transition |
| :--- | :--- | :--- | :--- | :--- |
| **`needs-triage`** | **Claude** | Claude 3.7 Sonnet (Thinking) | Tự đọc issue + `CONTEXT.md`, spawn 3 subagents (1. Đồng thuận/Khả thi, 2. Phản biện/Rủi ro, 3. Đột phá/Mở rộng), chốt spec.md. | $\rightarrow$ `ready-for-agent` (rõ ràng), `needs-info` (thiếu dữ kiện), hoặc `wontfix` (không làm). |
| **`needs-info`** | **Antigravity / Gemini** | Gemini 3.7 Flash (Thinking) | Chạy 2 hướng tìm kiếm (1 củng cố, 1 bác bỏ), tổng kết bổ sung câu trả lời vào issue. | $\rightarrow$ `ready-for-agent` (đủ dữ kiện) hoặc bắn thông báo mời human chốt. |
| **`ready-for-agent` / `in-progress`** | **Claude** | Claude 3.7 Sonnet (Thinking) | Lập trình cốt lõi, TDD test suite. Khi cần: gọi **Gemini 3.7 Flash** (tra cứu nhanh), **MiniMax-M3 / DeepSeek** (tác vụ cơ bắp, bulk boilerplate). | $\rightarrow$ `Review Stage` |
| **`Review Stage`** | **Hội đồng 3 Agent** | MiniMax-M3 + Dual Antigravity (Gemini Flash Thinking) | 1. MiniMax (Code review), 2. Antigravity (Verify feedback), 3. Antigravity (Arch review). Lỗi minor: tự fix trong worktree $\rightarrow$ `ready-for-human`. Lỗi major: trả về `ready-for-agent` (tối đa `$need_review_time` vòng). | $\rightarrow$ `ready-for-human` (Pass/Minor) hoặc `ready-for-agent` (Major). |
| **`ready-for-human`** | **Human Developer** | N/A | Bắn `notifications.show` ra Desktop & Orca Mobile để dev vào click xem Diff và Merge. | $\rightarrow$ `done` (Auto cleanup Worktree). |

## Domain Vocabulary & Glossary

| Term | Definition |
| :--- | :--- |
| **Task** | A discrete work unit mapped from a GitHub/GitLab issue or local markdown ticket, managed across the 6 Kanban lanes. |
| **Git Worktree** | An isolated file-tree and git branch managed natively by Orca ADE (`orca worktree create`) where an Agent codes and tests without interfering with the active workspace. |
| **Stage (Triage State)** | One of the 6 canonical states: `needs-triage` $\rightarrow$ `needs-info` $\rightarrow$ `ready-for-agent` $\rightarrow$ `in-progress` $\rightarrow$ `ready-for-human` $\rightarrow$ `done`. |
| **Tripartite Review** | A 3-agent committee comprising MiniMax-M3 (code & linter scan), Antigravity (feedback validation), and Antigravity Arch (architecture & conflict review). |
| **Review Cycle Limit** | Configurable guardrail (`$need_review_time`, default = `1`) capping major review retry round-trips to guarantee convergence. |
| **Self-Healing Loop** | An automated error recovery cycle ($\le 3$ retries) where the Coder Agent receives compiler/test/review failures and re-attempts implementation before alerting a human. |
| **Dual Notification** | A unified alert emitted via `notifications.show` that triggers both a native Desktop banner and an instant push notification to paired **Orca Mobile** devices. |
| **Crash Recovery** | The deterministic recovery protocol where interrupted in-flight tasks are reset to `ready-for-agent` upon Orca restart to prevent corrupted state resumption. |
| **Worktree Cleanup** | Automated teardown (`orca worktree remove`) and local branch deletion triggered after a Pull Request is merged. |





