# Dynamic Orca Agent & Model Discovery

**Status:** in-progress
**Assignee:** Claude 3.7 + Fleet
**Labels:** in-progress, architecture

## Spec Brief
Eliminate hardcoded agent and model lists. Dynamically probe installed Orca agents via PATH detection and Claude control protocol (`CLAUDE_MODEL_LIST_STDIN`).

### Acceptance Criteria
- [x] Query Orca canonical agents (`claude`, `antigravity`, `gemini`, `codex`, `opencode`, `pi`).
- [x] Probe Claude models stream-json list.
- [x] Read system environment model variables.
