# Tripartite Review Committee & Fast/Slow Remediation Flow

**Status:** review
**Assignee:** Hội Đồng 3 Agent (MiniMax + Dual Antigravity)
**Labels:** review, quality-assurance

## Spec Brief
Implement a 3-agent review committee running in parallel:
1. MiniMax-M3 for bulk syntax/linter scan.
2. Antigravity (Gemini Flash Thinking) for feedback verification.
3. Antigravity Architectural Reviewer for CONTEXT.md non-conflict check.

### Acceptance Criteria
- [x] `$need_review_time` cycle limit guardrail.
- [x] Fast-path in-place patch for minor issues.
- [x] Slow-path re-queue to ready-for-agent for major issues.
