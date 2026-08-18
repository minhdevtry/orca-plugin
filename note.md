# Orca AutoPilot Platform (Native Orca ADE + Matt Pocock Skills)

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
    NotifyService --> MobileApp[Orca Mobile Companion]
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

## 3. Tận dụng hạ tầng có sẵn của Orca

- **Plugin System:**
  - Định nghĩa trong `orca-plugin.json` (Webview Panels, Out-of-process Background Worker `main.mjs`, Event Bus).
  - Có các hook sự kiện: `worktree.created`, `agent.status.changed`, `notifications.show`.
- **Git Worktrees:** Quản lý môi trường nhánh cô lập cực kỳ mượt mà (`src/main/git/worktree.ts`).
- **Orchestration RPC Engine:**
  - `orca orchestration task-create`: Tạo task DAGs có dependencies (`--deps`).
  - `orca orchestration dispatch`: Giao task cho Agent kèm lifecycle preamble.
  - `orca orchestration check --wait`: Chờ kết quả tập trung từ các worker.
- **Mobile Companion App:** Ứng dụng Orca Mobile kết nối qua QR pairing, nhận thông báo đẩy tức thì.

---

## 4. Tận dụng Kanban Board của Orca với 6 Cột Matt Pocock

### A. Phát hiện quan trọng trong source Orca
Orca **đã có sẵn hạ tầng Kanban hoàn chỉnh**:
- `linear-board-drag-payload.ts`: Xử lý kéo thả task $\rightarrow$ mở Worktree $\rightarrow$ gán Agent.
- `AgentKanbanBoard.tsx` & `AgentDashboardDrawer.tsx`: Giao diện Kanban tối ưu với Design Tokens chuẩn.

### B. Ánh xạ 6 Cột Kanban Chuẩn Matt Pocock

| STT | Cột Kanban Orca | Label Matt Pocock / State | Hành vi Tự Hành |
| :--- | :--- | :--- | :--- |
| **1** | **📥 Needs Triage** | `needs-triage` | Task mới tạo, chờ phân loại hoặc kích hoạt Spec Agent (`/to-spec`). |
| **2** | **❓ Needs Info** | `needs-info` | Bị kẹt / thiếu thông tin / vượt quá 3 lần self-healing $\rightarrow$ Cần dev phản hồi. |
| **3** | **🤖 Ready for Agent** | `ready-for-agent` | Yêu cầu đã rõ. **Tự động 100%:** Tạo Git Worktree và kích hoạt Coder Agent. |
| **4** | **⚡ In Progress** | `in-progress` | Agent đang tích cực viết code, chạy kiểm thử `/tdd` trong Worktree. |
| **5** | **🔍 Ready for Human** | `ready-for-human` | Reviewer Agent đã duyệt pass, PR đã mở $\rightarrow$ Dev bấm xem Diff và Merge. |
| **6** | **✅ Done** | `done` / `closed` | Pull Request đã merge vào `main` $\rightarrow$ Tự động dọn dẹp Worktree. |

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

- **Cơ chế Sync:** Cài đặt trực tiếp vào thư mục `.agents/skills/`.
- Không cần fork hay sửa code gốc của Matt Pocock.
- Đọc cấu hình mapping nhãn tại: `docs/agents/triage-labels.md` và `docs/agents/issue-tracker.md`.

---

## 6. Tích hợp Native GitHub / GitLab (Zero OAuth Dance)

- Sử dụng trực tiếp phiên đăng nhập CLI trên máy:
  - GitHub: `gh issue list`, `gh issue view`, `gh pr create`, `gh pr merge`.
  - GitLab: `glab issue list`, `glab issue view`, `glab mr create`, `glab mr merge`.
- Không cần quản lý OAuth token hay viết GraphQL API riêng.

---

## 7. Hệ thống thông báo (Notification System)

Sử dụng cơ chế Native của Orca ADE (`notifications.show`):
- **Desktop:** Hiển thị thông báo native trên màn hình máy tính.
- **Mobile:** Tự động đẩy qua Web Relay tới ứng dụng **Orca Mobile** đã ghép nối (QR pairing). Không cần thiết lập thêm webhook Telegram/Discord bên ngoài.


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
| STT | Trục Quyết định | Quyết định Thống nhất | Đối chiếu Thực tế với Codebase Orca (`ref/orca`) |
| :--- | :--- | :--- | :--- |
| **1** | **Nguồn nạp Task** | Tận dụng cơ chế Task & Workspace của Orca + `gh` / `glab` CLI | Orca có sẵn GitHub Client (`src/main/github/client.ts`) dùng `ghExecFileAsync` và Linear Client (`src/main/linear/client.ts`). Plugin đọc qua `workspace.readContext`. |
| **2** | **Mức độ Tự hành** | **Tự động 100% (Full Autonomous)** | Orca hỗ trợ CLI `orca worktree create --agent <type> --prompt <text>` để tự động sinh workspace và kích hoạt agent ngầm. |
| **3** | **Xử lý Lỗi / Kẹt** | **Vòng lặp tự sửa tối đa 3 lần (`Self-healing <= 3`)** | Điều phối bởi `pipeline-orchestrator.mjs` kết hợp với nhãn `needs-info` của Matt Pocock skills. |
| **4** | **Động cơ Agent** | **Agent mặc định của Orca (Claude Code / DSH)**, hỗ trợ đổi per-task | Orca quản lý danh mục agent catalog (`src/renderer/src/lib/agent-catalog.ts`), hỗ trợ `claude`, `codex`, `pi`, `dsh`. |
| **5** | **Hệ thống Thông báo** | **Orca Native Desktop + Orca Mobile** (Không cần Webhook ngoài) | Soi mã nguồn `src/main/runtime/orca-runtime.ts` (L14202-L14224): `dispatchPluginNotification` (`notifications.show`) **tự động bắn notification sang cả Desktop và app Orca Mobile** qua QR Pairing. |

### 🔹 Vòng 2: Trải nghiệm Tương tác & Vận hành Worktree (Worktree & Interaction UX)
| STT | Trục Quyết định | Quyết định Thống nhất | Đối chiếu Thực tế với Codebase Orca (`ref/orca`) |
| :--- | :--- | :--- | :--- |
| **6** | **Quản lý Git Worktree** | **Theo chuẩn 100% của Orca Worktrees** | Tận dụng lệnh gốc `orca worktree create --issue <id> --name <name> --agent <agent>` để gắn kết trực tiếp vào sidebar và terminal của Orca (`src/main/git/worktree.ts`). |
| **7** | **Truyền ngữ cảnh (Handoff)** | **Orca Orchestration Prompt Bridge** | Chuyển tiếp Spec và checklist Tracer-bullets qua prompt khởi tạo của Coder Agent trong Worktree. |
| **8** | **Trải nghiệm Review & Diff** | **Tận dụng Trình xem Diff tích hợp của Orca** | Bấm vào thẻ ở cột `ready-for-human` sẽ mở trực tiếp Diff Viewer (`orca file open-changed --mode diff`) của Orca. |
| **9** | **Giám sát Agent thời gian thực** | **Click-to-Focus Live Worktree & Terminal** | Bấm vào bất kỳ thẻ nào đang chạy trong `in-progress` sẽ chuyển focus ngay lập tức sang tab Worktree và Terminal đang stream của Agent đó (`src/renderer/src/components/dashboard-popout/AgentKanbanCard.tsx`). |

### 🔹 Vòng 3: Khả năng Mở rộng, Xung đột & Giám sát (Concurrency, Conflicts & Telemetry)
| STT | Trục Quyết định | Quyết định Thống nhất | Đối chiếu Thực tế với Codebase Orca (`ref/orca`) |
| :--- | :--- | :--- | :--- |
| **10** | **Chạy song song (Concurrency)** | **Song song không giới hạn (Unlimited Parallel)** | Orca hỗ trợ đa Worktrees song song, mỗi worktree có PTY và terminal session tách biệt (`src/main/runtime/terminal-manager.ts`). |
| **11** | **Xử lý xung đột (Merge Conflicts)** | **Tự động kích hoạt `/resolving-merge-conflicts`** | Kết hợp phát hiện conflict từ `src/main/github/conflict-summary.ts` và tự động rebase `origin/main` qua skill `.agents/skills/resolving-merge-conflicts/`. |
| **12** | **Rào chắn chạy lặp (Guardrails)** | **Không giới hạn bước (No Arbitrary Limit)** | Để Agent chạy tự do hoàn thành bài toán. |
| **13** | **Lưu vết & Báo cáo (Audit Trail)** | **Lưu JSONL (`.agents/logs/`) + Tóm tắt vào PR** | Ghi log JSONL chi tiết từng bước/tool-call để replay khi cần; tự động sinh bản tóm tắt thay đổi và kết quả test chèn vào mô tả Pull Request. |

### 🔹 Vòng 4: Phục hồi Sự cố, Dọn dẹp & Môi trường Dev (Recovery, Cleanup & Dev UX)
| STT | Trục Quyết định | Quyết định Thống nhất | Chi tiết Triển khai |
| :--- | :--- | :--- | :--- |
| **14** | **Phục hồi sau Crash (Crash Recovery)** | **Reset sạch về `ready-for-agent`** | Khi Orca khởi động lại sau crash, task đang chạy dở được đưa về `ready-for-agent` để chạy lại từ đầu nhằm đảm bảo tính toàn vẹn tuyệt đối. |
| **15** | **Dọn dẹp Worktree (Worktree Cleanup)** | **Tự động xóa khi PR đã merge** | Sau khi PR được merge vào `main`, Plugin tự động gọi `orca worktree remove` và xóa nhánh local để giữ sidebar và ổ cứng sạch sẽ. |
| **16** | **Hot-Reload phát triển Plugin** | **Auto-sync Watcher (`--watch`)** | Dùng `node scripts/install-orca-plugin.mjs --watch` tự động tính hash SHA-256 và cập nhật `plugins.lock.json` ngay khi sửa code. |


---

## 10. Khám Phá Chuyên Sâu Mã Nguồn Orca (Deep Codebase Findings)

Qua rà soát chuyên sâu cây mã nguồn `ref/orca`, phát hiện 4 cơ chế thượng tầng có thể khai thác tối đa:

### 1️⃣ Kiến trúc Song Hành: Sandboxed Panel + Out-of-Process Worker
- **Sandboxed Panel (`panel/index.html`)**: Chạy trong iframe bảo mật, tự động nhận Design Tokens (`--background`, `--card`, `--primary`,...) từ Orca Host và gửi lệnh qua `window.parent.postMessage`.
- **Out-of-Process Worker (`main.mjs`)**: Được quản lý bởi `PluginWorkerManager` (`src/main/plugins/plugin-worker-manager.ts`). Chạy ngầm trong tiến trình Node.js độc lập, duy trì điều phối pipeline 24/7 ngay cả khi người dùng đóng panel Kanban.

### 2️⃣ Hệ Thống Bắt Sự Kiện Thời Gian Thực (Event Bus)
Trong `src/main/index.ts` (L2870-L2883) và `src/shared/plugins/plugin-manifest.ts`, Orca cung cấp 3 domain events cốt lõi:
- **`agent.status.changed`**: Bắn sự kiện thời gian thực khi trạng thái Agent chuyển đổi giữa `working`, `blocked`, `waiting`, `done`.
  - $\rightarrow$ *Ứng dụng:* Khi Coder Agent kết thúc (`state: 'done'`), hệ thống tự động bốc sang Reviewer Agent (`/code-review`) mà không cần polling! Khi Agent cần hỏi (`waiting`/`blocked`), tự chuyển cột sang `needs-info`.
- **`worktree.created` / `worktree.removed`**: Bắt sự kiện khi Worktree được cấp phát hoặc dọn dẹp.

### 3️⃣ Danh mục Agent Phổ quát (Universal Agent Catalog)
Trong `src/shared/agent-status-types.ts` (L21-L44), Orca đã chuẩn hóa sẵn giao thức nhận diện trạng thái cho hơn 20 loại Agent hàng đầu:
`claude`, `codex`, `gemini`, `antigravity`, `pi`, `omp`, `opencode`, `cursor`, `grok`, `aider`, `devin`,...
  - $\rightarrow$ *Ứng dụng:* Cho phép người dùng chuyển đổi linh hoạt bất kỳ Agent Engine nào cho từng task mà không cần viết custom parser.

### 4️⃣ Cầu nối Thông Báo Kép (Desktop & Mobile Bridge)
Trong `src/main/runtime/orca-runtime.ts` (L14202-L14224), phương thức `dispatchPluginNotification` (`notifications.show`) tự động kích hoạt cả:
- Native OS Notification trên máy tính.
- Web Relay đẩy trực tiếp sang ứng dụng di động **Orca Mobile** của người dùng.

---

## 11. Quyết Định Kiến Trúc: Thuần Orca Native Orchestrator vs DSH

So sánh và đánh giá 2 hướng kiến trúc để hiện thực hóa bài toán **Tự động hóa 100% theo Matt Pocock Skills**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔴 HƯỚNG A: Dùng DSH làm Động cơ Workflow trung gian                        │
│ Kanban -> Orca Plugin -> Chuyển task sang DSH Server -> DSH Subagents      │
│ ❌ Điểm trừ: Phải chạy song song 2 runtime, tốn RAM, dư thừa nhiều tầng.    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🟢 HƯỚNG B (ĐƯỢC CHỌN): Tự hành 100% trên Nền tảng Orca + Plugin Worker     │
│ Kanban -> Orca Plugin Worker (Node.js ngầm) -> Điều phối trực tiếp các Agent│
│ 🌟 Ưu điểm: Siêu tinh gọn, chạy 100% tự động từ A-Z, không cần cài DSH,     │
│             gọi được trực tiếp mọi Agent (Claude Code, Codex, Pi...).       │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Vai trò của DSH**: DSH không phải là tầng bắt buộc của hệ thống. DSH chỉ là **1 trong các tùy chọn Agent Engine** trong danh mục của Orca nếu người dùng muốn chạy model DeepSeek R1/V3.
- **Bộ não điều phối 100% tự hành**: Nằm hoàn toàn trong tiến trình Node.js ngầm của Plugin (`orca-autopilot-plugin/lib/pipeline-orchestrator.mjs`).

---

## 12. Khám Phá: Cơ Chế Coordinator & Orchestration Sẵn Có Trong Orca

Soi vào thư mục `ref/orca/src/main/runtime/orchestration/`:
- **`coordinator.ts`**: Orca đã xây dựng sẵn một máy trạng thái **DAG Coordinator**:
  ```ts
  type CoordinatorState = {
    runId: string
    phase: 'decomposing' | 'dispatching' | 'monitoring' | 'merging' | 'done'
    completedTasks: string[]
    failedTasks: string[]
    escalations: MessageRow[]
  }
  ```
- **`db.ts` & `OrchestrationDb`**: Orca sở hữu cơ chế lưu trữ SQLite quản lý hàng đợi task, mailbox trao đổi tin nhắn giữa các Agent và lưu vết tiến độ.
- $\rightarrow$ *Ứng dụng:* Plugin AutoPilot tận dụng trực tiếp các API và cấu trúc dữ liệu này của Orca để tối ưu hóa hiệu năng điều phối.

---

## 13. Khám Phá: Tự Động Hóa Kiểm Thử Web/UI qua Orca Browser CDP

Trong `ref/orca/src/main/browser/cdp-bridge.ts` và `snapshot-engine.ts`:
- Orca tích hợp sẵn headless browser tự động hóa thông qua Chrome DevTools Protocol (CDP) và accessibility tree snapshot (`orca snapshot`).
- $\rightarrow$ *Ứng dụng cho QA/Reviewer Agent:* Khi task là phát triển Web/UI, Reviewer Agent có thể tự khởi động dev server trong Worktree, dùng lệnh `orca snapshot` và `orca eval` để kiểm tra giao diện thực tế, chụp ảnh màn hình và đính kèm vào Pull Request trên GitHub!

---

## 14. Khám Phá: Kỹ Năng Điều Phối Chính Thức Của Orca (`orchestration` Skill)

Orca cung cấp bộ skill điều phối chính thức từ repository `https://github.com/stablyai/orca`:

### 🔄 1. Lệnh Quản Lý & Cập Nhật Skill Toàn Cục
- Cập nhật skill: `npx -y skills update orchestration --global -y`
- Cài đặt mới: `npx -y skills add https://github.com/stablyai/orca --skill orchestration --global -y`
- Đọc hướng dẫn chuẩn khớp version: `orca skills get orchestration`

### ⚡ 2. Giao Thức Điều Phối Đa Tác Tử (Orchestration Protocol)
- **Tạo task trong DAG**: `orca orchestration task-create --spec "..." --json`
- **Điều phối Worker**: `orca orchestration dispatch --task <task_id> --to <terminal_handle> --inject --json`
- **Lắng nghe kết quả không gián đoạn**: `orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json`
- **Báo cáo hoàn tất (Worker Report)**: `orca orchestration send --type worker_done --outcome succeeded --task-id <id> --dispatch-id <id> --json`
- **Dọn dẹp Worker**: `orca orchestration worker-release --terminal <handle>`
- $\rightarrow$ *Ứng dụng:* Plugin AutoPilot có thể gọi trực tiếp các lệnh native này của Orca CLI để thực hiện chuỗi phối hợp giữa Spec $\rightarrow$ Coder $\rightarrow$ Tester $\rightarrow$ Reviewer một cách chuẩn xác 100%!