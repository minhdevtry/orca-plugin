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

## Domain Vocabulary & Glossary

| Term | Definition |
| :--- | :--- |
| **Task** | A discrete work unit mapped from a GitHub/GitLab issue or local markdown ticket, managed across the 6 Kanban lanes. |
| **Git Worktree** | An isolated file-tree and git branch managed natively by Orca ADE (`orca worktree create`) where an Agent codes and tests without interfering with the active workspace. |
| **Stage (Triage State)** | One of the 6 canonical states: `needs-triage` $\rightarrow$ `needs-info` $\rightarrow$ `ready-for-agent` $\rightarrow$ `in-progress` $\rightarrow$ `ready-for-human` $\rightarrow$ `done`. |
| **Self-Healing Loop** | An automated error recovery cycle ($\le 3$ retries) where the Coder Agent receives compiler/test/review failures and re-attempts implementation before alerting a human. |
| **Dual Notification** | A unified alert emitted via `notifications.show` that triggers both a native Desktop banner and an instant push notification to paired **Orca Mobile** devices. |
| **Crash Recovery** | The deterministic recovery protocol where interrupted in-flight tasks are reset to `ready-for-agent` upon Orca restart to prevent corrupted state resumption. |
| **Worktree Cleanup** | Automated teardown (`orca worktree remove`) and local branch deletion triggered after a Pull Request is merged. |


