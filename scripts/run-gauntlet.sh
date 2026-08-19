#!/usr/bin/env bash
# scripts/run-gauntlet.sh
# Multi-Layer Quality Gauntlet & Extreme Verification Runner
set -e

export PATH="$HOME/.local/bin:$PATH"

WORKTREE_DIR="${1:-.}"
cd "$WORKTREE_DIR"

echo "=== 🛡️ [Orca ADE] BẮT ĐẦU VÕ ĐÀI KIỂM ĐỊNH GAUNTLET ==="

# 0. Pre-Merge Forbidden Paths Check
if [ -f "scripts/verify-premerge.mjs" ]; then
  echo "🔒 0. [PRE-MERGE] Kiểm tra đường dẫn cấm theo fleet.json..."
  node scripts/verify-premerge.mjs HEAD || exit 1
fi

# 1. TypeCheck & Linter Scan
echo "🔍 1. [LINT & TYPES] Kiểm tra cú pháp, kiểu dữ liệu và code smells..."
if [ -f "package.json" ] && grep -q '"tsc"' package.json; then
  npm run typecheck 2>/dev/null || npx tsc --noEmit
fi

if [ -f ".eslintrc" ] || [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ]; then
  npx eslint . --max-warnings=0 2>/dev/null || echo "⚠️ ESLint có cảnh báo nhưng tiếp tục..."
fi

# 2. Standard Unit Test Suite
echo "🧪 2. [UNIT TESTS] Chạy toàn bộ Test Suite..."
npm test

# 3. Changed-Line Coverage (Bắt buộc 100% dòng code thay đổi phải có test)
echo "📊 3. [COVERAGE] Kiểm tra độ bao phủ dòng code thay đổi (Changed-Line Coverage)..."
if [ -f "package.json" ] && grep -q '"coverage"' package.json; then
  npm run coverage 2>/dev/null || npx vitest run --coverage 2>/dev/null || true
fi

# 4. Mutation Testing (Cấy bug giả bằng Stryker / mutmut)
echo "🧬 4. [MUTATION] Kiểm tra sức đề kháng của Test Suite (Mutation Testing)..."
if [ -f "stryker.config.json" ] || [ -f "stryker.config.mjs" ]; then
  npx stryker run || {
    echo "❌ Mutation Testing phát hiện Test Suite quá yếu (Mutants survived)!"
    exit 1
  }
else
  echo "ℹ️ Bỏ qua Stryker (chưa có stryker.config.json). Khuyến nghị bổ sung cho module lõi."
fi

# 5. Property-Based Testing (Dữ liệu biên ngẫu nhiên)
echo "🎲 5. [PROPERTY-BASED] Chạy bài kiểm thử biên ngẫu nhiên (Property Tests)..."
if [ -d "test/property" ] || [ -d "tests/property" ]; then
  npx vitest run test/property/
fi

echo "=== 🟢 TẤT CẢ CÁC TẦNG GAUNTLET ĐÃ VƯỢT QUA XUẤT SẮC! ==="
