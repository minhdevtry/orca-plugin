# ADR 0001: Autonomous Multi-Agent Kanban Platform Architecture

## Status
Accepted (2026-08-18)

## Context
Orca ADE provides an autonomous development environment with worktrees and terminal multiplexing. We want an end-to-end multi-agent pipeline (`Spec -> Code -> Review -> PR`) integrated natively into Orca as a right-sidebar Kanban plugin, conforming to `mattpocock/skills` vocabulary and utilizing Orca's existing host infrastructure.

## Decisions

1. **Task Ingestion & Sources**:
   - Primary: Read focused workspace repository context and existing tasks from Orca ADE host services (`workspace.readContext`).
   - Secondary: Direct CLI integration with GitHub (`gh issue list`) and GitLab (`glab issue list`).
   - Fallback: Local markdown tasks stored in Orca plugin storage and `.scratch/`.

2. **State Machine & Triage Labels**:
   - Adopt the 5 canonical Matt Pocock triage labels + 1 complete state:
     `needs-triage` -> `needs-info` -> `ready-for-agent` -> `in-progress` -> `ready-for-human` -> `done`.

3. **100% Full Autonomy Trigger**:
   - Moving or triaging a task into `ready-for-agent` immediately spawns an isolated Git Worktree and launches the 4-agent pipeline automatically.

4. **Self-Healing & Error Recovery**:
   - If tests or code review fail during execution, the Coder Agent attempts self-healing for up to 3 iterations.
   - If still failing after 3 attempts, the task is labeled `needs-info` or `ready-for-human`, execution is paused, and an alert is dispatched.

5. **Zero-Webhook Notification Relay**:
   - Use Orca's host method `notifications.show`.
   - As confirmed in `ref/orca/src/main/runtime/orca-runtime.ts` (`dispatchPluginNotification`), this automatically displays native desktop notifications and relays push alerts directly to paired **Orca Mobile** devices without needing 3rd-party webhooks.

6. **Agent Engines**:
   - Default to Orca's active model (Claude Code / DeepSeek Harness DSH), with per-task override capability.

7. **Worktree & Branch Lifecycle**:
   - 100% delegate to Orca's native `orca worktree create --issue <id> --name <name> --agent <agent>` mechanism to preserve workspace tabs, integrated terminal multiplexing, and clean lifecycle management.

8. **Native Review & Diff UX**:
   - Leverage Orca's built-in Diff Viewer (`orca file open-changed --mode diff`) when inspecting tasks in `ready-for-human`.

9. **Live Observation & Click-to-Focus**:
   - Clicking an active task card in `in-progress` immediately focuses the corresponding Worktree and streaming terminal pane in Orca.

10. **Unlimited Concurrency**:
   - Tasks in `ready-for-agent` spawn parallel isolated Git Worktrees and agent instances concurrently without artificial queue bottlenecks.

11. **Automated Merge Conflict Resolution**:
   - Rebase against `origin/main` automatically and activate the `/resolving-merge-conflicts` skill when concurrent branches cause merge conflicts upon PR creation.

12. **Unconstrained Reasoning Budget**:
   - No hard limits on turns or execution time per stage to allow the agent to solve deep, multi-file problems to completion.

13. **Audit Trail & PR Summary**:
   - Persist structured JSONL execution logs at `.agents/logs/<task-id>.jsonl` for full replayability, and automatically format summary logs into GitHub/GitLab Pull Request descriptions.



## Consequences
- **Positive**:
  - Zero external dependency on third-party bots (Telegram/Discord).
  - Native look and feel matching Orca's dark/light design tokens and components.
  - Strict compliance with `mattpocock/skills` engineering workflow.
- **Negative**:
  - Full autonomy requires robust unit tests and sandboxed worktrees to prevent unconstrained agent loops.
