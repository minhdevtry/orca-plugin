#!/usr/bin/env bash
set -e

echo "🚀 [Orca ADE] Bắt đầu thiết lập môi trường Dual-Profile Claude Code (Official + MiniMax-M3)..."

USER_HOME="${HOME:-/home/$(whoami)}"

# 1. Tạo thư mục ~/.claude và cấu hình bypass permissions
mkdir -p "$USER_HOME/.claude"
cat << 'EOF' > "$USER_HOME/.claude/settings.json"
{
  "effortLevel": "high",
  "skipDangerousModePermissionPrompt": true,
  "defaultMode": "bypassPermissions",
  "permissionMode": "bypassPermissions"
}
EOF
echo "✅ Đã tạo cấu hình Official Claude tại ~/.claude/settings.json"

# 2. Tạo thư mục ~/.claude-ide và cấu hình MiniMax-M3
mkdir -p "$USER_HOME/.claude-ide"
cat << 'EOF' > "$USER_HOME/.claude-ide/settings.json"
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
EOF
echo "✅ Đã tạo cấu hình MiniMax-M3 tại ~/.claude-ide/settings.json"

# 3. Phê duyệt Custom API Key trong ~/.claude.json và ~/.claude-ide/.claude.json
for CONF in "$USER_HOME/.claude.json" "$USER_HOME/.claude-ide/.claude.json"; do
  if [ -f "$CONF" ]; then
    node -e "
      const fs = require('fs');
      try {
        const cfg = JSON.parse(fs.readFileSync('$CONF', 'utf8'));
        cfg.customApiKeyResponses = cfg.customApiKeyResponses || { approved: [], rejected: [] };
        cfg.customApiKeyResponses.approved = Array.from(new Set([
          ...(cfg.customApiKeyResponses.approved || []),
          'rKJs5SbGzvpuhu_hRdOU',
          'wfjiiqv1qds1v2u9lh7b',
          'sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU',
          'sk-b528wfjiiqv1qds1v2u9lh7b'
        ]));
        cfg.customApiKeyResponses.rejected = [];
        fs.writeFileSync('$CONF', JSON.stringify(cfg, null, 2), 'utf8');
      } catch (e) {}
    "
  else
    cat << 'EOF' > "$CONF"
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
EOF
  fi
done
echo "✅ Đã pre-approve Custom API Key cho MiniMax-M3"

# 4. Thiết lập Systemd User Environment (~/.config/environment.d/10-claude.conf)
mkdir -p "$USER_HOME/.config/environment.d"
cat << EOF > "$USER_HOME/.config/environment.d/10-claude.conf"
PATH=$USER_HOME/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
EOF

# Xóa các biến môi trường MiniMax khỏi session toàn cục để Claude gốc luôn là mặc định
systemctl --user unset-environment ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_SMALL_FAST_MODEL CLAUDE_CONFIG_DIR 2>/dev/null || true
echo "✅ Đã cấu hình PATH sạch tại ~/.config/environment.d/10-claude.conf (Official Claude là mặc định)"

# 5. Cài đặt Standalone Antigravity CLI (agy) & Pre-complete onboarding
if ! command -v agy >/dev/null 2>&1 || [ -L "$USER_HOME/.local/bin/agy" ]; then
  echo "📦 Đang cài đặt Google Antigravity CLI (agy)..."
  rm -f "$USER_HOME/.local/bin/agy"
  curl -fsSL https://antigravity.google/cli/install.sh | bash
fi

mkdir -p "$USER_HOME/.gemini/antigravity-cli"
cat << 'EOF' > "$USER_HOME/.gemini/antigravity-cli/settings.json"
{
  "enableTelemetry": false,
  "hasAgreedToTerms": true,
  "trustedWorkspaces": [
    "/home/minhdn3",
    "/home/minhdn3/Documents/orca-dhs",
    "/home/minhdn3/orca/workspaces/orca-dhs"
  ]
}
EOF

cat << 'EOF' > "$USER_HOME/.gemini/antigravity-cli/jetski_state.pbtxt"
post_onboarding:  {
  completed_steps:  POST_ONBOARDING_STEP_TYPE_MANAGER_WELCOME
  completed_steps:  POST_ONBOARDING_STEP_TYPE_USAGE_MODE
  completed_steps:  POST_ONBOARDING_STEP_TYPE_AGENT_CONFIGURATION
  completed_steps:  POST_ONBOARDING_STEP_TYPE_ADD_WORKSPACE
}
seen_nuxs: {
  uids: 31
  uids: 29
  uids: 24
  uids: 23
}
agent_onboarding_completed: AGENT_ONBOARDING_STATE_COMPLETED
EOF
echo "✅ Đã cấu hình Antigravity CLI (agy) & pre-complete onboarding"

# 6. Đồng bộ bộ kỹ năng Orca Orchestration toàn cục
mkdir -p "$USER_HOME/.agents/skills" "$USER_HOME/.claude/skills" "$USER_HOME/.claude-ide/skills"
if [ -d ".agents/skills/orca-orchestration" ]; then
  cp -r ".agents/skills/orca-orchestration" "$USER_HOME/.agents/skills/"
  ln -sfn "$USER_HOME/.agents/skills/orca-orchestration" "$USER_HOME/.claude/skills/orca-orchestration"
  ln -sfn "$USER_HOME/.agents/skills/orca-orchestration" "$USER_HOME/.claude-ide/skills/orca-orchestration"
  echo "✅ Đã đồng bộ bộ kỹ năng /orca-orchestration vào toàn bộ các thư mục cấu hình."
fi

echo "🎉 [HOÀN TẤT] Môi trường Triple-Agent (Claude Official + MiniMax-M3 + Antigravity CLI) đã sẵn sàng 100%!"

