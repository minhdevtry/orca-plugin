# Agents Guide & Subagent Orchestration Playbook for Orca ADE

## 1. Project Overview
This repository contains the **Orca AutoPilot Plugin** — an autonomous multi-agent coding platform and native Kanban board for Orca ADE.

---

## 2. 🤖 Subagent Orchestration Playbook (Dành Cho Agent Đang Chạy Trong Orca)

Khi bạn (Lead Agent) đang tương tác với người dùng trong Orca ADE và cần **giao việc cho Subagent** hoặc **chạy song song các tác tử con**:

### Bước 1: Tạo Git Worktree Con Cho Task
Mỗi task phải chạy trong một Worktree độc lập để tránh xung đột file:
```bash
orca worktree create --name "agent/task-<id-hoặc-tên-ngắn>" --json
```

---

### Bước 2: Khởi Chạy Tác Tử Con (Chọn 1 trong 3 Agent Profiles)

#### Lựa chọn A: Google Antigravity CLI (`agy`) — Model `gemini-3.7-flash-high` (Khuyến nghị cho Architecture, Research, Subagent)
> ⚠️ **Quy tắc**: Không dùng `worker-start --model` (vì Orca native lọc model). Dùng `orca terminal create` với custom-argv:
```bash
orca terminal create \
  --worktree "name:agent/task-<id>" \
  --title "worker-agy" \
  --command "agy --model gemini-3.7-flash-high --dangerously-skip-permissions" \
  --focus \
  --json
```

#### Lựa chọn B: Claude Code Official (Anthropic Team / Max - Sonnet 3.7)
```bash
orca terminal create \
  --worktree "name:agent/task-<id>" \
  --title "Official Claude" \
  --command "unset ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_SMALL_FAST_MODEL CLAUDE_CONFIG_DIR && claude --permission-mode bypassPermissions --dangerously-skip-permissions" \
  --focus \
  --json
```

#### Lựa chọn C: MiniMax-M3 Profile (Custom Gateway — Siêu Nhanh, Tối Ưu Coding & Syntax)
```bash
orca terminal create \
  --worktree "name:agent/task-<id>" \
  --title "MiniMax-M3" \
  --command 'export ANTHROPIC_BASE_URL="https://aiapi.2tocom.space" && export ANTHROPIC_API_KEY="sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU" && export ANTHROPIC_MODEL="MiniMax-M3" && export CLAUDE_CONFIG_DIR="$HOME/.claude-ide" && claude --permission-mode bypassPermissions --dangerously-skip-permissions' \
  --focus \
  --json
```

---

### Bước 3: Giao Task Kèm Cơ Chế Báo Cáo Ngược (Report-Back Protocol)
Từ JSON trả về của lệnh tạo terminal, lấy `result.terminal.handle` của con (ví dụ `term_child`) và lấy handle của cha (ví dụ `term_parent` qua `orca terminal list --worktree active --json`):

```bash
orca terminal send \
  --terminal <childHandle> \
  --text "Nhiệm vụ của bạn: /implement task #<id>. Hãy kiểm tra CONTEXT.md và viết unit tests /tdd. Khi hoàn thành toàn bộ, hãy chạy lệnh sau để báo cáo lại cho Parent Agent: orca terminal send --terminal <parentHandle> --text 'Subagent đã hoàn thành task #<id>. Đã chạy test và commit xong!' --enter --json" \
  --enter \
  --json
```

---

### Bước 4: Kiểm Tra Tiến Độ & Đợi Kết Quả (Native Orca Wait)

#### Cách 1: Đợi Tác Tử Con Hoàn Thành Natively (Non-blocking hoặc Blocking):
```bash
# Chờ cho đến khi Subagent xong turn và quay về trạng thái idle:
orca terminal wait --terminal <childHandle> --for tui-idle --timeout-ms 300000 --json
```

#### Cách 2: Đọc Trực Tiếp Output Cuối Cùng Của Subagent:
```bash
# Đọc 50 dòng kết quả mới nhất của Subagent:
orca terminal read --terminal <childHandle> --limit 50 --json
```

#### Cách 3: Mở Trình Soi Diff Của Worktree Con:
```bash
# Mở ngay Diff viewer của Worktree con để review:
orca file open-changed --mode diff --worktree "name:agent/task-<id>" --json
```


---

## 3. 🎯 Matt Pocock Skill Prompts & Triage Lifecycle

| Cột Kanban | Tác Tử Phụ Trách | Skill Prompt Chuẩn |
| :--- | :--- | :--- |
| **`needs-triage`** | Claude Official | `/triage #<id>`: Đọc issue, phân tích 3 góc nhìn (Đồng thuận, Rủi ro, Đột phá), chạy `/to-spec` sinh `spec.md`. |
| **`needs-info`** | Antigravity (`agy`) | `/research #<id>`: Điều tra 2 giả thuyết đối nghịch (Pro vs Con) để làm rõ điểm nghẽn kỹ thuật. |
| **`ready-for-agent` / `in-progress`** | MiniMax-M3 / Claude | `/implement #<id>`: Bám sát spec, áp dụng `/tdd`, tạo các atomic commits. |
| **`ready-for-review`** | Hội đồng 3 Agent | `/code-review since main`: MiniMax quét syntax + Antigravity soi kiến trúc / CONTEXT.md. |
| **`ready-for-human`** | Lead Agent | `/finishing-a-development-branch`: Full tests, kiểm tra conflict và mở PR. |

---

## 4. 🛠️ Phát Triển & Kiểm Thử Plugin Orca
- **Thư mục plugin**: `orca-autopilot-plugin/`
- **Chạy unit tests**: `npm test` (trong thư mục `orca-autopilot-plugin/`)
- **Cài đặt plugin vào Orca**: `node scripts/install-orca-plugin.mjs .`
- **Tài liệu chi tiết**: [`docs/orca-minimax-setup-guide.md`](docs/orca-minimax-setup-guide.md)
