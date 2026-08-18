# ADR 0001: 100% Native Multi-Agent Orchestration Architecture in Orca ADE

## Status
Accepted (2026-08-18)

## Context
We needed an end-to-end multi-agent orchestration platform (`Triage -> Spec -> TDD Implementation -> Self-Healing Verification -> Tripartite Review Gate -> Release PR`) running directly in **Orca ADE**. We evaluated building a custom sidebar plugin wrapper versus adopting Orca's **100% Native Orchestration Engine (`orca orchestration`)** combined with the **Matt Pocock Skills Framework (`mattpocock/skills`)**.

## Decisions

### 1. 100% Pure Native Orchestration (No Custom Plugin Overhead)
- We eliminated the need for custom UI/plugin daemons.
- All coordination is handled natively by Orca's built-in state machine: `run-create`, `task-create`, `dispatch --inject`, `check --wait`, `gate-create`, and `gate-resolve`.

### 2. Specialized 3-Agent Fleet Matrix
- **Claude Official (Sonnet 5 / Claude Team)**: Triage, requirements engineering, technical spec design (`spec.md`), and Lead Coordinator.
- **MiniMax-M3 (Custom Gateway)**: High-speed coding, test-driven development (`/tdd`), and syntax/linter scan.
- **Antigravity CLI (`agy` - Gemini 3.7 Flash High)**: Pro/Con technical research, architecture audit, and `CONTEXT.md` verification.

### 3. 3-Tier Hierarchy & Hard Cap (Max Depth = 3)
- **Level 1 (Lead Coordinator)**: Runs in `main`/root or triggered by `orca automations`. Coordinates Runs, Tasks, and Decision Gates.
- **Level 2 (Feature Worker)**: Runs in worktree `agent/task-<id>`. Executes TDD `/implement`. Allowed to spawn **at most 1 Leaf Helper** (Level 3) for assistance.
- **Level 3 (Leaf Helper / Thợ Phụ)**: Runs in sub-terminal. Pure task helper (mock data, docs). **STRICTLY FORBIDDEN from spawning any children (`Depth <= 3`)**.

### 4. Deterministic Self-Healing Test Loop (Evidence Before Assertions)
- The Lead Coordinator directly runs shell verification (`npm test`) in the child worktree instead of trusting model self-claims.
- An automated self-healing retry budget ($\le 3$ iterations) is enforced. If tests fail $\ge 3$ times, the task transitions to `needs-info` and escalates to a human.

### 5. Cryptographic Decision Gates & Tripartite Review Committee
- A native Decision Gate (`orca orchestration gate-create`) locks the task before release.
- A 3-agent committee performs a 2-axis review (MiniMax for Standards + Antigravity for Architecture + Claude for Spec).
- The gate is resolved (`orca orchestration gate-resolve --resolution "yes"`) only when consensus is reached.

### 6. State Alignment & UI Desync Healing
- **Authoritative Truth**: The remote GitHub Issue Label is always treated as the authoritative ground truth.
- When an agent initializes or opens a task terminal, it automatically queries GitHub labels and reconciles the Orca Workspace Board (`orca worktree set --workspace-status <label>`).

### 7. Background Autonomous Ingestion via Scheduled Automations
- Hands-free background polling is handled by `orca automations create` with a lightweight shell `--precheck` probe (0 tokens / 0 RAM when no issues are open).

## Consequences
- **Positive**: Zero custom plugin maintenance, zero token waste on UI duplication, resilient to human drag-and-drop mistakes, 100% compliant with Matt Pocock skills and Orca ADE ecosystem.
- **Portability**: The entire architecture is contained within `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, and `.agents/skills/orca-orchestration/` — fully portable to any new repository in 3 simple steps.
