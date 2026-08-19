#!/usr/bin/env bash
# scripts/safe-research.sh
# Read-Only Tripwire & Architecture Audit Runner for Antigravity (agy)

set -e

export PATH="$HOME/.local/bin:$PATH"

WORKTREE_DIR="${1:-.}"
BRIEF_FILE="${2:-}"

echo "=== 🔒 [Orca ADE] KHỞI ĐỘNG RESEARCH SESSION AN TOÀN ==="

if [ ! -d "$WORKTREE_DIR" ]; then
  echo "❌ Thư mục worktree không tồn tại: $WORKTREE_DIR"
  exit 1
fi

# 1. Chụp snapshot trạng thái git trước khi chạy (Fingerprint)
PRE_HASH=$(git -C "$WORKTREE_DIR" status --porcelain 2>/dev/null | sha256sum | awk '{print $1}')
echo "📸 Pre-execution Git Fingerprint: $PRE_HASH"

# 2. Chạy Antigravity ở chế độ Plan / Read-Only
if [ -n "$BRIEF_FILE" ] && [ -f "$BRIEF_FILE" ]; then
  agy --cd "$WORKTREE_DIR" --mode plan --model gemini-3.7-flash-high < "$BRIEF_FILE"
else
  agy --cd "$WORKTREE_DIR" --mode plan --model gemini-3.7-flash-high -p "Thẩm định kiến trúc theo CONTEXT.md và spec.md. Chế độ READ-ONLY tuyệt đối không sửa file mã nguồn."
fi

# 3. Chụp snapshot sau khi chạy
POST_HASH=$(git -C "$WORKTREE_DIR" status --porcelain 2>/dev/null | sha256sum | awk '{print $1}')
echo "📸 Post-execution Git Fingerprint: $POST_HASH"

# 4. Kiểm tra Tripwire (Bẫy vi phạm)
if [ "$PRE_HASH" != "$POST_HASH" ]; then
  echo "⚠️ [TRIPWIRE CẢNH BÁO] Phát hiện vi phạm Read-Only: Antigravity đã làm thay đổi file trong lúc Research!"
  git -C "$WORKTREE_DIR" status --short
  echo "🧹 Đang tự động khôi phục lại trạng thái làm việc sạch..."
  git -C "$WORKTREE_DIR" checkout .
  git -C "$WORKTREE_DIR" clean -fd
  exit 1
else
  echo "✅ Hoàn tất Research an toàn. Mã nguồn được bảo toàn nguyên vẹn 100%."
fi
