# 🐳 Hướng Dẫn Cấu Hình MiniMax-M3 & Dual-Profile Claude Code Trong Orca ADE

Tài liệu này ghi lại toàn bộ quy trình thiết lập, cơ chế hoạt động và cẩm nang di chuyển (migration checklist / 1-click setup) sang máy mới cho hệ thống **Orca AutoPilot Plugin** chạy song song **Official Claude Code** và **MiniMax-M3**.

---

## 1. ⚡ Thiết Lập Tự Động 1-Click Cho Máy Mới (Dành Cho Agent & Human)

Khi chuyển sang máy tính mới hoặc thiết lập lại môi trường từ đầu, chỉ cần bảo Agent hoặc chạy lệnh duy nhất sau tại thư mục gốc của repository:

```bash
./scripts/setup-agent-profiles.sh
```

Script này tự động:
1. Tạo cấu hình `~/.claude/settings.json` (Official Claude) với chế độ **Bypass Permissions**.
2. Tạo cấu hình `~/.claude-ide/settings.json` (MiniMax-M3) với Gateway `https://aiapi.2tocom.space`, model `MiniMax-M3` và nạp skills Matt Pocock.
3. Tự động thêm API Key vào `customApiKeyResponses.approved` (tránh lỗi 401 rejected key).
4. Thiết lập Systemd User Environment `~/.config/environment.d/10-claude.conf`.
5. Chạy unit tests và cài đặt plugin trực tiếp vào Orca ADE (`node scripts/install-orca-plugin.mjs .`).

---

## 2. 🏗️ Tổng Quan Kiến Trúc Dual-Profile (Architecture Overview)

Hệ thống hoạt động theo mô hình **Dual-Profile** độc lập để không làm xung đột giữa tài khoản Claude Code chính thức và Model tùy biến (MiniMax-M3):

```
                     ┌────────────────────────────────────────────────────────┐
                     │                       Orca ADE                         │
                     │ (Autonomous Multi-Agent Kanban & Child Worktrees)      │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
┌─────────────────────────────────┐                       ┌─────────────────────────────────┐
│     Main / Default Profile      │                       │     MiniMax-M3 Profile          │
│   Thư mục: ~/.claude            │                       │   Thư mục: ~/.claude-ide        │
│   File: ~/.claude.json          │                       │   File: ~/.claude-ide/settings.json │
│   Auth: Anthropic OAuth (Team)  │                       │   Auth: Custom API Key          │
│   Mô hình: Claude Sonnet 3.7    │                       │   Mô hình: MiniMax-M3           │
│   Gateway: api.anthropic.com    │                       │   Gateway: aiapi.2tocom.space   │
│   Mode: bypassPermissions       │                       │   Mode: bypassPermissions       │
└─────────────────────────────────┘                       └─────────────────────────────────┘
```

---

## 3. 📝 Chi Tiết Các File Cấu Hình Thủ Công

### 3.1. Cấu hình Profile MiniMax-M3: `~/.claude-ide/settings.json`
Tạo hoặc chỉnh sửa file `~/.claude-ide/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://aiapi.2tocom.space",
    "ANTHROPIC_API_KEY": "sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU",
    "ANTHROPIC_MODEL": "MiniMax-M3",
    "ANTHROPIC_SMALL_FAST_MODEL": "MiniMax-M3",
    "CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT": "1",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": 450000
  },
  "model": "MiniMax-M3",
  "enabledPlugins": {
    "mattpocock-skills@mattpocock": true
  },
  "extraKnownMarketplaces": {
    "mattpocock": {
      "source": {
        "source": "github",
        "repo": "mattpocock/skills"
      }
    }
  },
  "effortLevel": "high",
  "skipDangerousModePermissionPrompt": true,
  "defaultMode": "bypassPermissions",
  "permissionMode": "bypassPermissions"
}
```

> **Lưu ý quan trọng**: Model ID chuẩn của upstream gateway là `"MiniMax-M3"` (không thêm hậu tố `[1m]` vào request API để tránh lỗi *model unreachable*).

---

### 3.2. Cấu hình Official Claude: `~/.claude/settings.json`
Tạo file `~/.claude/settings.json`:

```json
{
  "effortLevel": "high",
  "skipDangerousModePermissionPrompt": true,
  "defaultMode": "bypassPermissions",
  "permissionMode": "bypassPermissions"
}
```

---

### 3.3. Biến Môi Trường Toàn Hệ Thống: `~/.config/environment.d/10-claude.conf`
Trên Linux/Ubuntu, tạo file `~/.config/environment.d/10-claude.conf` để mọi ứng dụng GUI (như Orca ADE) và subshell kế thừa tự động:

```conf
# Systemd user environment config for Claude & MiniMax-M3
PATH=/home/minhdn3/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ANTHROPIC_BASE_URL="https://aiapi.2tocom.space"
ANTHROPIC_API_KEY="sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU"
ANTHROPIC_MODEL="MiniMax-M3"
ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M3"
CLAUDE_CONFIG_DIR=/home/minhdn3/.claude-ide
```

Sau khi tạo, kích hoạt ngay lập tức mà không cần reboot:
```bash
systemctl --user import-environment ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_SMALL_FAST_MODEL CLAUDE_CONFIG_DIR
```

---

### 3.4. Bỏ Qua Màn Hình Trust & Tự Động Phê Duyệt API Key
Cấu trúc `customApiKeyResponses` trong cả `~/.claude.json` và `~/.claude-ide/.claude.json`:

```json
{
  "customApiKeyResponses": {
    "approved": [
      "rKJs5SbGzvpuhu_hRdOU",
      "wfjiiqv1qds1v2u9lh7b",
      "sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU",
      "sk-b528wfjiiqv1qds1v2u9lh7b"
    ],
    "rejected": []
  }
}
```

*(Plugin Orca AutoPilot tích hợp sẵn hàm `autoTrustClaudeWorktree` tự động ghi nhận các thông số này).*

---

## 4. 🚀 Lệnh Khởi Chạy Song Song 2 Tác Tử Trong Orca ADE

### Khởi Chạy Official Claude (Anthropic Team / Max):
```bash
orca terminal create \
  --worktree "name:agent/claude-official" \
  --title "Official Claude" \
  --command "unset ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_SMALL_FAST_MODEL CLAUDE_CONFIG_DIR && claude --permission-mode bypassPermissions --dangerously-skip-permissions" \
  --focus \
  --json
```

### Khởi Chạy MiniMax-M3 (Custom Gateway):
```bash
orca terminal create \
  --worktree "name:agent/minimax-m3" \
  --title "MiniMax-M3" \
  --command 'export ANTHROPIC_BASE_URL="https://aiapi.2tocom.space" && export ANTHROPIC_API_KEY="sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU" && export ANTHROPIC_MODEL="MiniMax-M3" && export CLAUDE_CONFIG_DIR="$HOME/.claude-ide" && claude --permission-mode bypassPermissions --dangerously-skip-permissions' \
  --focus \
  --json
```

---

## 5. 🤖 Điều Phối Subagent: Antigravity CLI (`agy`) Với Gemini 3.7 Flash High

Khi cần chia việc cho subagent hoặc phân chia tác vụ đa tác tử (Orchestration):
- Sử dụng Agent **`agy`** (Google Antigravity CLI) với model **`gemini-3.7-flash-high`**.

### 5.1. Cài Đặt Standalone Antigravity CLI:
> ⚠️ **Lưu ý quan trọng**: Không dùng bản IDE (`antigravity-ide` / `alias antigravity`). Phải cài đặt đúng bản CLI độc lập `agy` tại `~/.local/bin/agy`:

```bash
# Xóa symlink cũ nếu có và tải bản CLI chính thức:
rm -f ~/.local/bin/agy
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

Kiểm tra phiên bản:
```bash
agy --version
# Output: 1.1.14 (ELF 64-bit executable)
```

---

### 5.2. Khởi Động Antigravity Subagent Trong Orca ADE (Custom-Argv):
> 💡 **Quy tắc vàng**: Orca ADE không hỗ trợ `worker-start --model gemini...` (vì catalog mặc định chỉ nhận Claude/Codex/Cursor). Thay vào đó, **phải khởi chạy `agy` bằng `custom-argv` qua `orca terminal create`**:

```bash
orca terminal create \
  --worktree "name:agent/subagent-agy" \
  --title "worker-agy" \
  --command "agy --model gemini-3.7-flash-high --dangerously-skip-permissions" \
  --focus \
  --json
```

### 5.3. Giao Task Cho Antigravity Worker:
Sau khi terminal khởi tạo, gửi chỉ thị trực tiếp vào handle của terminal con:
```bash
orca terminal send \
  --terminal <terminalHandle> \
  --text "Chào bạn! Hãy thực thi task #101 theo /implement..." \
  --enter \
  --json
```

---

## 6. 🛠️ Cẩm Nang Khắc Phục Sự Cố (Troubleshooting FAQ)

| Triệu chứng | Nguyên nhân cốt lõi | Cách xử lý dứt điểm |
| :--- | :--- | :--- |
| **`401 Invalid x-api-key`** | Key `sk-cu...` bị gửi nhầm sang `ai.2tocom.space` thay vì `aiapi.2tocom.space`. | Kiểm tra `ANTHROPIC_BASE_URL="https://aiapi.2tocom.space"` trong `.env` và `settings.json`. |
| **`401 Invalid or missing API key`** | Claude Code tự động lưu key vào mảng `customApiKeyResponses.rejected`. | Mở `~/.claude.json` và `~/.claude-ide/.claude.json`, xóa key khỏi `rejected` và thêm vào `approved`. |
| **`Error: The model is currently unreachable`** | Dùng sai tên model có hậu tố như `MiniMax-M3[1m]`. | Sửa `"model": "MiniMax-M3"` trong `settings.json` và `ANTHROPIC_MODEL="MiniMax-M3"`. |
| **Hỏi Trust folder mỗi khi mở Worktree** | Worktree mới chưa được đăng ký trong `projects` config. | Hàm `autoTrustClaudeWorktree()` trong `worktree-setup.mjs` sẽ tự ghi `hasTrustDialogAccepted: true`. |
| **Claude trả lời xong tự thoát về Shell** | Chạy cờ `-p` (Print mode). | Chạy trực tiếp `claude` (không có `-p`) để giữ phiên tương tác Interactive REPL. |
| **Hỏi quyền khi đọc/ghi file hoặc chạy Bash** | Chưa bật Bypass Permissions mode. | Truyền cờ `--permission-mode bypassPermissions --dangerously-skip-permissions` và đặt `"defaultMode": "bypassPermissions"` trong `settings.json`. |
| **`worker-start` từ chối model Gemini** | Orca native `worker-start` chỉ lọc Claude/Codex. | Dùng `orca terminal create --command "agy --model gemini-3.7-flash-high"` để bypass. |

