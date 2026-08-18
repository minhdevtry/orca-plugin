# 🐳 Hướng Dẫn Cấu Hình MiniMax-M3 & Dual-Profile Claude Code Trong Orca ADE

Tài liệu này ghi lại toàn bộ quy trình thiết lập, cơ chế hoạt động và cẩm nang di chuyển (migration checklist) sang máy mới cho hệ thống **Orca AutoPilot Plugin** chạy cùng **MiniMax-M3** qua Claude Code CLI.

---

## 1. 🏗️ Tổng Quan Kiến Trúc (Architecture Overview)

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
└─────────────────────────────────┘                       └─────────────────────────────────┘
```

---

## 2. 📝 Chi Tiết Các File Cấu Hình (Configuration Files)

### 2.1. Cấu hình Profile MiniMax-M3: `~/.claude-ide/settings.json`
Tạo hoặc chỉnh sửa file `/home/<user>/.claude-ide/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://aiapi.2tocom.space",
    "ANTHROPIC_API_KEY": "sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU",
    "ANTHROPIC_MODEL": "MiniMax-M3",
    "ANTHROPIC_SMALL_FAST_MODEL": "MiniMax-M3",
    "CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT": "1"
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
  "skipDangerousModePermissionPrompt": true
}
```

> **Lưu ý quan trọng**: Model ID chuẩn của upstream gateway là `"MiniMax-M3"` (không thêm hậu tố `[1m]` vào request API để tránh lỗi *model unreachable*).

---

### 2.2. Biến Môi Trường Toàn Hệ Thống: `~/.config/environment.d/10-claude.conf`
Trên Linux/Ubuntu, tạo file `/home/<user>/.config/environment.d/10-claude.conf` để mọi ứng dụng GUI (như Orca ADE) và subshell kế thừa tự động:

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

### 2.3. Bỏ Qua Màn Hình Trust & Tự Động Phê Duyệt API Key
Để Claude Code không bao giờ dừng lại hỏi `Do you trust this folder?` hoặc `Do you want to use this custom API key?`, cần đảm bảo cấu trúc `customApiKeyResponses` và `projects` trong cả `~/.claude.json` và `~/.claude-ide/.claude.json`:

```json
{
  "customApiKeyResponses": {
    "approved": [
      "rKJs5SbGzvpuhu_hRdOU",
      "sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU"
    ],
    "rejected": []
  },
  "projects": {
    "/home/minhdn3/Documents/orca-dhs": {
      "hasTrustDialogAccepted": true,
      "hasCompletedProjectOnboarding": true
    }
  }
}
```

*(Plugin Orca AutoPilot đã tích hợp hàm `autoTrustClaudeWorktree` tự động ghi các thông số này mỗi khi tạo Worktree con).*

---

## 3. 🚀 Quy Trình Giao Việc Vào Child Worktree (Orca Integration)

Khi người dùng bấm **Start Pipeline** trên Kanban Board hoặc chạy qua CLI:

1. **Tạo Child Worktree Cô Lập**:
   ```bash
   orca worktree create --repo "id:<repoId>" --name "agent/task-<number>" --json
   ```
2. **Khởi Động Tab Terminal Con Kèm MiniMax-M3**:
   ```bash
   orca terminal create \
     --worktree "name:agent/task-<number>" \
     --command "export ANTHROPIC_BASE_URL=\"https://aiapi.2tocom.space\" && export ANTHROPIC_API_KEY=\"sk-cu-gHdIi...\" && export ANTHROPIC_MODEL=\"MiniMax-M3\" && export CLAUDE_CONFIG_DIR=\"$HOME/.claude-ide\" && claude" \
     --focus \
     --json
   ```
3. **Gửi Chỉ Thị Giao Việc Trực Tiếp**:
   ```bash
   orca terminal send --terminal <terminalHandle> --text "Chào bạn! Hãy thực thi task theo /implement..." --enter --json
   ```

---

## 4. 📋 Checklist Chuyển Sang Máy Mới (New Machine Setup Guide)

Khi thiết lập trên một máy tính mới, chỉ cần thực hiện 5 bước sau:

### Bước 1: Cài đặt Claude Code CLI & Orca CLI
```bash
npm install -g @anthropic-ai/claude-code
# Đảm bảo lệnh `orca` và `claude` có trong PATH (~/.local/bin hoặc global npm)
```

### Bước 2: Tạo thư mục cấu hình `.claude-ide`
```bash
mkdir -p ~/.claude-ide
cat << 'EOF' > ~/.claude-ide/settings.json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://aiapi.2tocom.space",
    "ANTHROPIC_API_KEY": "sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU",
    "ANTHROPIC_MODEL": "MiniMax-M3",
    "ANTHROPIC_SMALL_FAST_MODEL": "MiniMax-M3",
    "CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT": "1"
  },
  "model": "MiniMax-M3",
  "enabledPlugins": {
    "mattpocock-skills@mattpocock": true
  },
  "effortLevel": "high",
  "skipDangerousModePermissionPrompt": true
}
EOF
```

### Bước 3: Cấu hình User Environment (`~/.config/environment.d/10-claude.conf`)
```bash
mkdir -p ~/.config/environment.d
cat << EOF > ~/.config/environment.d/10-claude.conf
PATH=$HOME/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ANTHROPIC_BASE_URL="https://aiapi.2tocom.space"
ANTHROPIC_API_KEY="sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU"
ANTHROPIC_MODEL="MiniMax-M3"
ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M3"
CLAUDE_CONFIG_DIR=$HOME/.claude-ide
EOF

systemctl --user import-environment ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_SMALL_FAST_MODEL CLAUDE_CONFIG_DIR
```

### Bước 4: Cài đặt Orca AutoPilot Plugin
```bash
cd /path/to/orca-dhs/orca-autopilot-plugin
npm install
npm test
node scripts/install-orca-plugin.mjs .
```

### Bước 5: Kiểm tra kết nối nhanh (Smoke Test)
```bash
CLAUDE_CONFIG_DIR=$HOME/.claude-ide claude -p "Xin chào MiniMax-M3!"
```
Nếu terminal trả lời bằng tiếng Việt và hiển thị đúng ngữ cảnh dự án $\rightarrow$ **Cấu hình hoàn tất 100%!** ✨

---

## 5. 🛠️ Cẩm Nang Khắc Phục Sự Cố (Troubleshooting FAQ)

| Triệu chứng | Nguyên nhân cốt lõi | Cách xử lý dứt điểm |
| :--- | :--- | :--- |
| **`401 Invalid x-api-key`** | Key `sk-cu...` bị gửi nhầm sang `ai.2tocom.space` thay vì `aiapi.2tocom.space`. | Kiểm tra `ANTHROPIC_BASE_URL="https://aiapi.2tocom.space"` trong `.env` và `settings.json`. |
| **`401 Invalid or missing API key`** | Claude Code tự động lưu key vào mảng `customApiKeyResponses.rejected`. | Mở `~/.claude.json` và `~/.claude-ide/.claude.json`, xóa key khỏi `rejected` và thêm vào `approved`. |
| **`Error: The model is currently unreachable`** | Dùng sai tên model có hậu tố như `MiniMax-M3[1m]`. | Sửa `"model": "MiniMax-M3"` trong `settings.json` và `ANTHROPIC_MODEL="MiniMax-M3"`. |
| **Hỏi Trust folder mỗi khi mở Worktree** | Worktree mới chưa được đăng ký trong `projects` config. | Hàm `autoTrustClaudeWorktree()` trong `worktree-setup.mjs` sẽ tự ghi `hasTrustDialogAccepted: true`. |
| **Claude trả lời xong tự thoát về Shell** | Chạy cờ `-p` (Print mode). | Chạy trực tiếp `claude` (không có `-p`) để giữ phiên tương tác Interactive REPL. |
