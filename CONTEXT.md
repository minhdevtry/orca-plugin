# Orca AutoPilot Plugin & Fleet Context

## Overview
**Orca AutoPilot Plugin** is an autonomous multi-agent engineering platform and interactive Kanban board integrated as a native plugin for **Orca ADE** (Autonomous Development Environment).

## Key Components
1. **`orca-autopilot-plugin`**:
   - `orca-plugin.json`: Orca plugin manifest defining the sidebar panel (`autopilot-kanban`), capabilities (`terminal.write`, `notifications.show`, `storage.readwrite`, `workspace.read`), and event subscriptions.
   - `panel/index.html`: Native dark/light-mode Kanban board UI rendered inside Orca's right sidebar. Inherits host design tokens and communicates via `window.parent.postMessage`.
   - `main.mjs`: Out-of-process worker implementation for Orca RPC protocol.
   - `lib/pipeline-orchestrator.mjs`: 4-agent pipeline state machine (`/to-spec` -> `/implement` + `/tdd` -> `/code-review` -> PR creation).
   - `lib/github-gitlab-adapter.mjs`: CLI bridge for GitHub (`gh`) & GitLab (`glab`).

2. **`.agents/skills/`**:
   - 35 skills from `mattpocock/skills` supporting engineering, triage, spec, implementation, TDD, code review, and domain modeling workflows.
