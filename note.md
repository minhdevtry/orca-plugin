# Autonomous Multi-Agent Coding Platform (Orca + DSH + Matt Pocock Skills)

> **Tài liệu thiết kế kiến trúc & Ghi chú kỹ thuật**  
> Cập nhật lần cuối: 18/08/2026

---

## 1. Mục tiêu & Bài toán (Core Objective)

Xây dựng nền tảng **Autonomous Multi-Agent Coding Platform**:
- Tự động hóa toàn bộ chu trình: `Đọc Issue GitHub/GitLab` $\rightarrow$ `Viết Spec` $\rightarrow$ `Lập trình & Test (TDD)` $\rightarrow$ `Code Review` $\rightarrow$ `Mở PR & Merge`.
- Hỗ trợ xây dựng các dự án **POC / MVP** từ đầu (local-first hoặc qua prompt tự do).
- Dev người dùng chỉ nhận thông báo khi:
  - Công việc hoàn tất (**Done**).
  - Cần ra quyết định / phê duyệt (**Needs Human Intervention**).
  - Gặp lỗi / bế tắc (**Stuck / Failed**).

---

## 2. Kiến trúc luồng 4 Agents (Autonomous Pipeline)

```mermaid
graph TD
    Trigger([Issue GitHub/GitLab hoặc Prompt POC]) --> Orchestrator[Orchestrator Engine]

    subgraph Autonomous Workflow
        Orchestrator --> Agent1[1. Spec & Architecture Agent]
        Agent1 -->|/to-spec, /domain-modeling, /to-tickets| SpecArtifact[Spec.md + Slices]
        
        SpecArtifact --> Agent2[2. Coder & Implementer Agent]
        Agent2 -->|Worktree cô lập + /implement, /tdd| CodeArtifact[Code & Unit Tests]
        
        CodeArtifact --> Agent3[3. Reviewer & QA Agent]
        Agent3 -->|/code-review, /diagnosing-bugs| ReviewGate{Review Pass?}
        
        ReviewGate -->|Có lỗi / Chưa đạt| Agent2
        ReviewGate -->|Đạt chuẩn| Agent4[4. Release & PR Agent]
        
        Agent4 -->|gh pr create / glab mr create| PRResult[Pull Request Opened]
    end

    Autonomous Workflow -.->|Notify: Done / Stuck / Gate| NotifyService[Notification System]
    NotifyService --> DesktopOS[Desktop Notification]
    NotifyService --> MobileApp[Orca Mobile Companion / Webhook]
```

### Chi tiết 4 Agents:
1. **Agent 1 — Spec & Triage Agent:**
   - Đọc Issue từ GitHub/GitLab qua `gh issue view` / `glab issue view` hoặc file markdown `.scratch/issues/`.
   - Sử dụng các skill: `/to-spec`, `/domain-modeling`, `/to-tickets`.
   - Phân rã bài toán thành các lát cắt dọc (**tracer-bullet slices**).
2. **Agent 2 — Coder & Implementer Agent:**
   - Được cấp **Git Worktree độc lập** (không đụng chạm code nhánh chính hay agent khác).
   - Sử dụng các skill: `/implement`, `/tdd`, `/migrate-to-shoehorn`.
   - Viết test trước $\rightarrow$ viết code $\rightarrow$ verify test suite pass.
3. **Agent 3 — Reviewer & QA Agent:**
   - Chạy trên context sạch, độc lập với Coder.
   - Sử dụng các skill: `/code-review`, `/diagnosing-bugs`.
   - Đánh giá theo 2 trục: **Standards** (Coding style, Linter) và **Spec** (Đúng yêu cầu ban đầu).
4. **Agent 4 — Release & PR Agent:**
   - Sử dụng các skill: `/finishing-a-development-branch`, `/resolving-merge-conflicts`.
   - Tạo commit nguyên tử (atomic commits), chạy `gh pr create` / `glab mr create` kèm tóm tắt và test evidence.

---

## 3. Tận dụng hạ tầng có sẵn của Orca & DSH

### A. Orca (`v1.4.184`)
- **Plugin System:**
  - Định nghĩa trong `orca-plugin.json` (hỗ trợ Webview Panels, Background Worker `main.mjs`, Event Bus).
  - Có các hook sự kiện: `worktree.created`, `agent.status.changed`, `notifications.show`.
- **Git Worktrees:** Quản lý môi trường nhánh cô lập cực kỳ mượt mà.
- **Orchestration RPC Engine:**
  - `orca orchestration run-create`: Tạo không gian điều phối.
  - `orca orchestration task-create`: Tạo task DAGs có dependencies (`--deps`).
  - `orca orchestration worker-start`: Khởi chạy bất kỳ Agent CLI nào (`claude`, `codex`, `dsh`, `opencode`, `pi`).
- **Mobile Companion App:** Có sẵn app iOS (TestFlight/AppStore) và Android kết nối qua Relay.

### B. DeepSeek Harness (`v0.1.0-rc.7`)
- **Cordis Plugin Framework:** `@deepseek-ai/cordis` cho phép inject custom services, lifecycle hooks và model-callable tools (`defineTool`).
- **Subagent Engine:** `@deepseek-ai/dsh-subagent` hỗ trợ quản lý worker background không đồng bộ.

---

## 4. Tận dụng Kanban Board của Orca với Labels Matt Pocock

### A. Phát hiện quan trọng trong source Orca
Orca **đã có sẵn hạ tầng Kanban hoàn chỉnh**:
- `linear-board-drag-payload.ts`: Xử lý kéo thả task $\rightarrow$ mở Worktree $\rightarrow$ gán Agent.
- `AgentKanbanBoard.tsx` & `AgentDashboardDrawer.tsx`: Giao diện Kanban phân cột sẵn:
  - 🚨 `attention` (Needs You)
  - ⚡ `working` (Working)
  - 💤 `idle` (Ready / Backlog)
  - ✅ `done` (Done)

### B. Ánh xạ Labels của Matt Pocock vào Cột Kanban

Thay vì phụ thuộc Linear trả phí, ta dùng **GitHub / GitLab Issue Labels** (và local `.scratch/issues/*.md`):

| Cột Kanban Orca | Label Matt Pocock / State | Hành vi kích hoạt Agent |
| :--- | :--- | :--- |
| **📥 Backlog / Triage** | `needs-triage`, `needs-info` | Chờ User duyệt hoặc chạy Agent 1 (`/triage`) để làm rõ yêu cầu |
| **🤖 Ready for Agent** | `ready-for-agent` | Đã có brief/spec chuẩn. Kéo thả vào đây để xếp hàng chờ bốc |
| **⚡ In Progress** | `in-progress` / `status:in-progress` | **Tự động:** Tạo Worktree $\rightarrow$ chạy `worker-start` cho Coder Agent (`/implement`) |
| **🔍 In Review / QA** | `in-review` / `ready-for-human` | **Tự động:** Coder xong $\rightarrow$ Reviewer Agent chạy `/code-review`, mở PR |
| **✅ Done** | `done` / `closed` | PR được merge $\rightarrow$ Issue đóng, dọn dẹp Worktree |

### C. Cơ chế State Mutex (Loại trừ nhãn cũ khi đổi cột)
Khi kéo thẻ hoặc Agent cập nhật trạng thái:
```bash
# Atomic update label qua GitHub CLI:
gh issue edit <id> --remove-label "ready-for-agent" --add-label "in-progress"

# Hoặc qua GitLab CLI:
glab issue update <id> --remove-label "ready-for-agent" --add-label "in-progress"
```

---

## 5. Tương thích bộ skill `mattpocock/skills` (Zero-Fork)

- **Cơ chế Sync:** Tải/Submodule trực tiếp từ `https://github.com/mattpocock/skills.git` vào thư mục `.agents/skills/` hoặc `~/.gemini/config/skills/`.
- Không cần fork hay sửa code gốc của Matt Pocock.
- Đọc cấu hình mapping nhãn tại: `docs/agents/triage-labels.md` và `docs/agents/issue-tracker.md` (chuẩn `/setup-matt-pocock-skills`).

---

## 6. Tích hợp Native GitHub / GitLab (Zero OAuth Dance)

- Sử dụng trực tiếp phiên đăng nhập CLI trên máy:
  - GitHub: `gh issue list`, `gh issue view`, `gh pr create`, `gh pr merge`.
  - GitLab: `glab issue list`, `glab issue view`, `glab mr create`, `glab mr merge`.
- Không cần quản lý OAuth token hay viết GraphQL API riêng.

---

## 7. Hệ thống thông báo (Notification System)

1. **Desktop:**
   - Orca Host API: `orca.host.call('notifications.show', { title, body })`.
   - Native OS: `notify-send` (Linux) / AppleScript (macOS).
2. **Mobile:**
   - **Cách 1 (Sẵn có của Orca):** Orca Mobile Companion App (nhận push notifications thời gian thực từ relay).
   - **Cách 2 (Webhook mở rộng):** Tích hợp Webhook bắn tin nhắn qua Telegram Bot / Discord / Pushover / NTFY khi có sự kiện cần can thiệp.

---

## 8. Kế hoạch triển khai (Implementation Roadmap)

- [x] **Giai đoạn 1: Core Orchestrator CLI & Adapter**
  - Xây dựng state-machine điều phối 4 bước: `Spec -> Code -> Review -> PR`.
  - Kết nối `gh` / `glab` CLI với bộ nhãn chuẩn của `mattpocock/skills`.
  - Viết unit tests đạt 100% độ bao phủ.
- [x] **Giai đoạn 2: Tích hợp Orca Plugin & Native Kanban**
  - Đóng gói Orca Plugin (`orca-plugin.json` + Sandboxed CSP-compliant Panel).
  - Tái sử dụng components, layout, typography từ `AgentKanbanBoard.tsx` của Orca.
  - Cấu hình 6 cột Kanban tương thích 100% với 5 Matt Pocock State Labels (`needs-triage`, `needs-info`, `ready-for-agent`, `in-progress`, `ready-for-human`, `done`).
  - Hashing và đăng ký tự động vào `plugins.lock.json` và `orca-data.json`.
- [ ] **Giai đoạn 3: Khép kín Luồng Tự hành 100% (Full Autonomous Loop)**
  - Tự động spawn Git Worktree khi card vào `ready-for-agent`.
  - Triển khai Self-healing loop tối đa 3 vòng khi test/review fail.
  - Tích hợp `notifications.show` phát đồng thời tới Desktop & Orca Mobile.

---

## 9. Kết quả Phiên Phỏng vấn Kiến trúc (Grill-Me Decisions)

Đã hoàn thành các vòng phỏng vấn kiến trúc (Grill-Me) và chốt toàn bộ các quyết định thiết kế:

### 🔹 Vòng 1: Kiến trúc Cốt lõi (Core Architecture)
| STT | Trục Quyết định | Quyết định Thống nhất | Lý do & Khảo sát Thực tế từ Codebase Orca |
| :--- | :--- | :--- | :--- |
| **1** | **Nguồn nạp Task** | Tận dụng cơ chế Task & Workspace của Orca + `gh` / `glab` CLI | Orca đã tự nhận diện repository và remote của workspace hiện tại. Không cần viết lại module đọc task từ đầu. |
| **2** | **Mức độ Tự hành** | **Tự động 100% (Full Autonomous)** | Khi task vào `ready-for-agent` (hoặc kéo vào `in-progress`), orchestrator tự động mở Git Worktree, code `/implement + /tdd`, review `/code-review`, và mở PR mà không bắt người dùng bấm thủ công từng bước. |
| **3** | **Xử lý Lỗi / Kẹt** | **Vòng lặp tự sửa tối đa 3 lần (`Self-healing <= 3`)** | Agent tự sửa test/review tối đa 3 vòng. Nếu vẫn fail, tự dán nhãn `needs-info` hoặc `ready-for-human`, pause task và bắn notification báo động cho dev. |
| **4** | **Động cơ Agent** | **Agent mặc định của Orca (Claude Code / DSH)**, hỗ trợ đổi per-task | Linh hoạt tận dụng các model mạnh nhất được cấu hình trong Orca. |
| **5** | **Hệ thống Thông báo** | **Orca Native Desktop + Orca Mobile** (Không cần Webhook ngoài) | Soi mã nguồn `ref/orca/src/main/runtime/orca-runtime.ts` (L14202-L14224): Hàm `dispatchPluginNotification` (`notifications.show`) **tự động bắn notification sang cả Desktop và app Orca Mobile** qua QR Pairing. |

### 🔹 Vòng 2: Trải nghiệm Tương tác & Vận hành Worktree (Worktree & Interaction UX)
| STT | Trục Quyết định | Quyết định Thống nhất | Chi tiết Triển khai |
| :--- | :--- | :--- | :--- |
| **6** | **Quản lý Git Worktree** | **Theo chuẩn 100% của Orca Worktrees** | Tận dụng lệnh gốc `orca worktree create --issue <id> --name <name> --agent <agent>` để gắn kết trực tiếp vào sidebar và terminal của Orca. |
| **7** | **Truyền ngữ cảnh (Handoff)** | **Orca Orchestration Prompt Bridge** | Chuyển tiếp Spec và checklist Tracer-bullets qua prompt khởi tạo của Coder Agent trong Worktree. |
| **8** | **Trải nghiệm Review & Diff** | **Tận dụng Trình xem Diff tích hợp của Orca** | Bấm vào thẻ ở cột `ready-for-human` sẽ mở trực tiếp Diff Viewer (`orca file open-changed --mode diff`) của Orca. |
| **9** | **Giám sát Agent thời gian thực** | **Click-to-Focus Live Worktree & Terminal** | Bấm vào bất kỳ thẻ nào đang chạy trong `in-progress` sẽ chuyển focus ngay lập tức sang tab Worktree và Terminal đang stream của Agent đó. |