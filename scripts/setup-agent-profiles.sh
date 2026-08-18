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
ANTHROPIC_BASE_URL="https://aiapi.2tocom.space"
ANTHROPIC_API_KEY="sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU"
ANTHROPIC_MODEL="MiniMax-M3"
ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M3"
CLAUDE_CONFIG_DIR=$USER_HOME/.claude-ide
EOF

# Nạp vào systemd session nếu có
systemctl --user import-environment ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_SMALL_FAST_MODEL CLAUDE_CONFIG_DIR 2>/dev/null || true
echo "✅ Đã cấu hình systemd user environment tại ~/.config/environment.d/10-claude.conf"

# 5. Cài đặt plugin vào Orca
if [ -d "orca-autopilot-plugin" ]; then
  cd orca-autopilot-plugin
  npm test
  node scripts/install-orca-plugin.mjs .
elif [ -f "package.json" ] && grep -q "orca-autopilot" package.json; then
  npm test
  node scripts/install-orca-plugin.mjs .
fi

echo "🎉 [HOÀN TẤT] Môi trường Dual-Profile Orca ADE đã sẵn sàng 100%!"
