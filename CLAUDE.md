# 🐳 Claude Guide for Orca ADE

## 1. Project Overview
This repository operates on a **100% Native Multi-Agent Architecture** in Orca ADE, integrating the **Matt Pocock Skills Framework (`mattpocock/skills`)** with **Orca Native Orchestration** across a specialized 3-agent fleet:
- **Claude Official (Sonnet 5 / Claude Team)**: Triage, Spec & Lead Coordinator.
- **MiniMax-M3 (Custom Gateway)**: Fast Coding, TDD Implementation & Syntax Review.
- **Antigravity CLI (`agy` - Gemini 3.7 Flash High)**: Technical Research & Architecture Review.

---

## 2. ⚡ Core Orchestration Skill
For the full end-to-end 6-stage lifecycle, exact CLI commands, Decision Gates, and auto-trust setup, **always activate the dedicated skill**:
👉 **`/orca-orchestration`** *(located at `skills/orca-orchestration/SKILL.md`)*

---

## 3. 👑 3-Tier Hierarchy & Hard Cap (Max Depth = 3)
- **Level 1 (Lead Coordinator)**: Runs in `main`/root or triggered by `orca automations`. Coordinates Runs, Tasks, and Decision Gates.
- **Level 2 (Feature Worker)**: Runs in worktree `agent/task-<id>`. Executes TDD `/implement`. Allowed to spawn **at most 1 Leaf Helper** (Level 3) for assistance.
- **Level 3 (Leaf Helper / Thợ Phụ)**: Runs in sub-terminal. Pure task helper (mock data, docs). **STRICTLY FORBIDDEN from spawning any children (`Depth <= 3`)**.

---

## 4. 🎯 Status & Skills Quick Reference

| Status | Git Label | Orca Board Status | Matt Pocock Skill | Primary Agent |
| :--- | :--- | :--- | :--- | :--- |
| **Triage** | `needs-triage` | `needs-triage` | `/triage`, `/to-spec` | Claude Official |
| **Research** | `needs-info` | `needs-info` | `/research`, `/domain-modeling` | Antigravity (`agy`) |
| **Ready** | `ready-for-agent` | `ready-for-agent` | `/to-tickets` | Lead Coordinator |
| **Coding** | `in-progress` | `in-progress` | `/implement`, `/tdd` | MiniMax-M3 |
| **Review** | `ready-for-human` | `ready-for-human` | `/code-review`, `/finishing` | 3-Agent Committee |
| **Done** | (Closed) | `done` | `/handoff` | Lead Coordinator |
| **Reject** | `wontfix` | `wontfix` | — | Lead Coordinator |

> 🔄 **State Healing Invariant**: If a user drags a card on the Orca UI to the wrong column, the agent always treats the **GitHub Issue Label as the authoritative truth** and automatically reconciles the Orca Workspace Board (`orca worktree set --workspace-status <label>`).

---

## 5. 🛠️ Development & Testing
- Unit tests: `npm test`
- Domain documentation: [`CONTEXT.md`](CONTEXT.md)
- Playbook details: [`skills/orca-orchestration/SKILL.md`](skills/orca-orchestration/SKILL.md)
