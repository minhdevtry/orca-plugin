# Orca ADE Multi-Agent Architecture & Domain Context

## 1. Overview
This repository defines the **100% Native Multi-Agent Architecture** for **Orca ADE** (Autonomous Development Environment), combining the **Matt Pocock Skills Framework (`mattpocock/skills`)** with **Orca Native Orchestration (`stablyai/orca`)** across a specialized 3-agent fleet.

---

## 2. Core Architectural Pillars

### 1. Hạ Tầng Điều Phối Bản Địa Orca (`orca orchestration`)
- **Runs (`run-create`)**: Defines the high-level objective and root execution session.
- **Tasks (`task-create`)**: Registers isolated work units with clickable IDs (`task_...`).
- **Dispatch & Preamble (`dispatch --inject`)**: Spawns subagents in dedicated Git Worktrees with injected supervisory contracts.
- **Supervised Loop (`check --wait`)**: Event queue listening for `worker_done`, `escalation`, `question`, and 15s heartbeats.
- **Decision Gates (`gate-create` & `gate-resolve`)**: Cryptographic checkpoints requiring 3-agent committee approval before unlocking PR creation.
- **Worker Release (`worker-release`)**: Terminates worker terminals and archives execution transcripts for `worker-read`.

### 2. Bộ Kỹ Năng Chuẩn Matt Pocock (`.agents/skills/`)
- **Triage & Spec**: `/triage`, `/to-spec`, `/to-tickets`.
- **Implementation & TDD**: `/implement`, `/tdd` (Red-Green-Refactor).
- **Architecture & Research**: `/research`, `/domain-modeling`, `/codebase-design`.
- **Tripartite Review**: `/code-review` (2-axis standards + spec compliance), `/diagnosing-bugs`.
- **Branch Release**: `/finishing-a-development-branch`, `/resolving-merge-conflicts`.

### 3. Phi Đội 3 Tác Tử Chuyên Biệt (Specialized 3-Agent Fleet)
1. **Claude Official (Sonnet 5 / Claude Team)**: Triage, phân tích nghiệp vụ, viết spec kỹ thuật và làm Lead Coordinator.
2. **MiniMax-M3 (Custom Gateway)**: Lập trình siêu tốc, viết Unit Test TDD, quét cú pháp và linter.
3. **Antigravity CLI (`agy` - Gemini 3.7 Flash High)**: Nghiên cứu kỹ thuật Pro/Con, thẩm định kiến trúc và soi `CONTEXT.md`.

---

## 3. 3-Tier Hierarchy & Non-Proliferation Rules (Depth $\le$ 3)

```
Level 1: Lead Coordinator (Root workspace / Orca Scheduled Automation)
   │
   └── Level 2: Feature Worker (Git Worktree: `agent/task-<id>`)
          │
          └── Level 3: Leaf Helper (Sub-terminal / Split pane in same worktree)
                 └── 🚫 Non-Proliferation: NEVER spawn children (Depth <= 3)
```

1. **Level 1 (Lead Coordinator)**: Điều hành Run, mở Worktree cho task, phân công Cấp 2, kiểm soát Decision Gates.
2. **Level 2 (Feature Worker)**: Nhận task `/implement` + `/tdd`. Được phép mở **tối đa 1 Thợ Phụ / Thằng Đệ (Cấp 3)** (`helper-agy` hoặc `helper-m3`) để trợ giúp việc nhỏ.
3. **Level 3 (Leaf Helper / Thợ Phụ)**: Làm đúng việc được giao (viết mock data, tra cứu doc). **CẤM TUYỆT ĐỐI việc mở thêm agent cấp 4**.

---

## 4. Tự Động Chữa Lệch Trạng Thái (State Alignment & Desync Healing)

> **CHÂN LÝ NGUỒN**: Nhãn GitHub Issue (`git label`) luôn là nguồn chân lý tối cao.

Khi bất kỳ Agent nào bắt đầu phiên làm việc hoặc khởi chạy terminal:
1. Đọc nhãn từ GitHub (`gh issue view <id> --json labels`).
2. Cưỡng chế đồng bộ bảng Orca Workspace (`orca worktree set --issue <id> --workspace-status <label>`).
3. Khi chuyển giai đoạn, luôn thực thi **cặp lệnh nguyên tử (Atomic Dual-Update)** cho cả GitHub Issue và Orca Board.

---

## 5. Bảng Tra Cứu Trạng Thái & Kỹ Năng Tương Ứng

| Trạng Thái | Git Label | Orca Board Status | Matt Pocock Skill | Primary Agent |
| :--- | :--- | :--- | :--- | :--- |
| **Triage** | `needs-triage` | `needs-triage` | `/triage`, `/to-spec` | Claude Official (Sonnet 5) |
| **Research** | `needs-info` | `needs-info` | `/research`, `/domain-modeling` | Antigravity (`agy` Gemini 3.7) |
| **Ready** | `ready-for-agent` | `ready-for-agent` | `/to-tickets` | Lead Coordinator |
| **Coding** | `in-progress` | `in-progress` | `/implement`, `/tdd`, `/diagnosing-bugs` | MiniMax-M3 |
| **Review** | `ready-for-human` | `ready-for-human` | `/code-review`, `/finishing` | 3-Agent Committee |
| **Done** | (Closed) | `done` | `/handoff` | Lead Coordinator |
| **Reject** | `wontfix` | `wontfix` | — | Lead Coordinator |
