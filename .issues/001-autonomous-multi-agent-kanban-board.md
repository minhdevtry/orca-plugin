# Autonomous Multi-Agent Kanban Board Plugin for Orca ADE

**Status:** ready-for-human
**Assignee:** Claude Sonnet 5
**Labels:** ready-for-human, core-feature

## Spec Brief
Build a zero-fork, native webview panel plugin for Orca ADE providing a 7-lane Kanban board (`needs-triage`, `needs-info`, `ready-for-agent`, `in-progress`, `review`, `ready-for-human`, `done`).

### Acceptance Criteria
- [x] Sandboxed iframe panel matching Orca dark/light theme tokens.
- [x] Host postMessage RPC bridge.
- [x] Drag and drop status lane changes.
- [x] Slide-out Task Detail & Multi-Agent Log Drawer.
