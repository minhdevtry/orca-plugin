# Orca ADE Plugin Development, Testing & Best Practices Guide

Tài liệu hướng dẫn chuẩn hóa quy trình phát triển, kiểm thử tối ưu và khắc phục các lỗi đặc thù khi xây dựng plugin mở rộng cho **Orca ADE** (Autonomous Development Environment).

---

## 📑 Mục Lục
1. [Kiến Trúc Orca Plugin (Worker vs Panel)](#1-kiến-trúc-orca-plugin-worker-vs-panel)
2. [Cảnh Báo Đặc Thù: Xung Đột GNOME Screen Reader Trên Linux](#2-cảnh-báo-đặc-thù-xung-đột-gnome-screen-reader-trên-linux)
3. [Quy Trình Kiểm Thử Tối Ưu (Fast & Silent Unit Tests)](#3-quy-trình-kiểm-thử-tối-ưu-fast--silent-unit-tests)
4. [Cơ Chế Hot-Reloading Trong Môi Trường Dev (`devPluginPaths`)](#4-cơ-chế-hot-reloading-trong-môi-trường-dev-devpluginpaths)
5. [Quy Tắc An Toàn Giao Diện & CSP Trong Sandboxed Iframe](#5-quy-tắc-an-toàn-giao-diện--csp-trong-sandboxed-iframe)
6. [Tích Hợp Dữ Liệu Thực & 7 Làn Canonical Pipeline](#6-tích-hợp-dữ-liệu-thực--7-làn-canonical-pipeline)

---

## 1. Kiến Trúc Orca Plugin (Worker vs Panel)

Một plugin của Orca ADE gồm hai thành phần hoạt động độc lập:

```
┌───────────────────────────────────────────────────────────┐
│                     Orca ADE Host                         │
├─────────────────────────────┬─────────────────────────────┤
│   Plugin Worker (Node.js)   │  Plugin Panel (Web Iframe)  │
│   (main.mjs / lib/)         │  (panel/index.html)         │
├─────────────────────────────┼─────────────────────────────┤
│ • Full Node.js runtime      │ • Sandboxed HTML/CSS/JS     │
│ • Child processes & CLI     │ • Bị khóa bởi CSP nghiêm ngặt│
│ • Git Worktree & Filesystem │ • Giao tiếp qua postMessage │
│ • GitHub / GitLab API (gh)  │ • Hiển thị UI / Kanban / Log│
│ • orca.commands.register    │ • actions: workspace.read...│
└─────────────────────────────┴─────────────────────────────┘
```

- **Manifest chuẩn (`orca.plugin.json`)**: Khai báo quyền `capabilities` (`workspace:read`, `terminal:send`, `notifications:show`, `storage`), `contributes.panels`, `contributes.commands`, và `activationEvents: ["onStartupFinished"]`.

---

## 2. Cảnh Báo Đặc Thù: Xung Đột GNOME Screen Reader Trên Linux

> [!CAUTION]
> **Lỗi Phổ Biến**: Gọi lệnh `orca` trực tiếp trên Linux bên ngoài terminal được Orca quản lý sẽ khởi chạy **GNOME Screen Reader** (`/usr/bin/orca` - ứng dụng đọc màn hình trợ năng), làm nhảy cửa sổ *"Screen Reader Preferences / Configuration"* và phát âm thanh liên tục!

### Nguyên Nhân
- Trên hệ điều hành Linux (Ubuntu/Debian/GNOME), lệnh `/usr/bin/orca` thuộc về hệ thống GNOME Screen Reader.
- Binary thực tế của Orca IDE được đặt tên là `orca-ide` (thường nằm tại `~/.local/share/orca/app/orca-ide`).

### Giải Pháp Chuẩn (Safe Resolver Pattern)
Luôn giải quyết đường dẫn executable thông qua hàm resolver an toàn:

```javascript
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const execFileAsync = promisify(execFile)

export async function resolveOrcaBinary() {
  // 1. Kiểm tra biến môi trường chỉ định rõ
  if (process.env.ORCA_CLI_COMMAND) return process.env.ORCA_CLI_COMMAND

  // 2. Không bao giờ gọi CLI ngoài trong Unit Test
  if (process.env.NODE_ENV === 'test') return null

  // 3. Tìm orca-ide trên PATH
  try {
    const { stdout } = await execFileAsync('which', ['orca-ide'])
    if (stdout.trim()) return stdout.trim()
  } catch (e) {}

  // 4. Tìm đường dẫn cài đặt mặc định trên Linux
  const defaultLinuxPath = join(process.env.HOME || '', '.local/share/orca/app/orca-ide')
  if (existsSync(defaultLinuxPath)) return defaultLinuxPath

  // 5. Nếu đang chạy bên trong terminal của Orca (có biến ORCA_TERMINAL_ID)
  if (process.env.ORCA_TERMINAL_ID) return 'orca'

  return null
}
```

---

## 3. Quy Trình Kiểm Thử Tối Ưu (Fast & Silent Unit Tests)

Để unit tests chạy nhanh (dưới 1.5 giây), ổn định và không làm phiền màn hình người dùng:

1. **Dập Tắt Notification Spam Khi Test**:
   Trong các module phát thông báo desktop (`lib/notification-relay.mjs`), hãy bọc điều kiện kiểm tra:
   ```javascript
   export async function sendNotification({ title, body, orcaHost }) {
     if (process.env.NODE_ENV === 'test' || process.env.CI) {
       return { delivered: true, skipped: 'test_env' }
     }
     // Chỉ chạy notify-send khi chạy thật
   }
   ```
2. **Kiểm Tra Cú Pháp Panel HTML/JS Tự Động**:
   Viết test trích xuất thẻ `<script>` trong `panel/index.html` và biên dịch bằng `new Function()` để bắt lỗi cú pháp ngay trước khi cài đặt:
   ```javascript
   const html = fs.readFileSync('panel/index.html', 'utf8')
   const match = html.match(/<script>([\s\S]*?)<\/script>/)
   if (match) new Function(match[1]) // Sẽ ném lỗi nếu có syntax error
   ```
3. **Chạy Test Bằng Node Test Runner Tích Hợp**:
   ```bash
   node --test test/*.test.mjs
   ```

---

## 4. Cơ Chế Hot-Reloading Trong Môi Trường Dev (`devPluginPaths`)

Thay vì phải liên tục tính toán lại `Content Hash` và copy file vào thư mục cache của Orca mỗi khi sửa code, hãy thêm đường dẫn thư mục làm việc của plugin vào cài đặt Orca:

**File cấu hình**: `~/.config/orca/profiles/local-default/orca-data.json`
```json
{
  "settings": {
    "devPluginPaths": [
      "/home/minhdn3/Documents/orca-dhs/orca-autopilot-plugin"
    ]
  }
}
```
Khi khai báo trong `devPluginPaths`:
- Orca ADE tự động đọc trực tiếp mã nguồn từ thư mục dự án.
- Bạn chỉ cần bấm nút `↻ Refresh` trên Panel hoặc đóng/mở lại tab để nhận code mới tức thì.

---

## 5. Quy Tắc An Toàn Giao Diện & CSP Trong Sandboxed Iframe

Host của Orca bọc toàn bộ Panel trong iframe sandboxed với CSP nghiêm ngặt:
```http
Content-Security-Policy: default-src 'none'; connect-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:;
```

### Các Lưu Ý Sống Còn Về UI:
1. **Không Dùng External Network (`connect-src 'none'`)**: Panel không thể gọi `fetch()` ra internet hoặc API ngoài. Mọi tác vụ lấy dữ liệu ngoài phải do Worker đảm nhiệm.
2. **Cú Pháp CSS Phải Khép Kín 100%**: 
   - Nếu trong thẻ `<style>` có **bất kỳ một dấu `{` nào chưa đóng ngoặc `}`**, trình duyệt sẽ hủy bỏ toàn bộ các rule CSS phía sau!
   - Điều này dẫn đến hiện tượng toàn bộ giao diện rớt về văn bản thô (Times New Roman) và các modal ẩn bị vỡ tràn lan.
3. **Sử Dụng Đúng CSS Tokens Của Orca**:
   - Host Orca tự động inject các biến CSS sau vào `:root`:
     - `--background`, `--foreground`
     - `--card`, `--card-foreground`
     - `--muted`, `--muted-foreground`
     - `--border`, `--accent`, `--primary`, `--radius`
   - Thiết kế UI dùng các biến này sẽ tự động ăn khớp 100% với giao diện Dark/Light mode của Orca.

---

## 6. Tích Hợp Dữ Liệu Thực & 7 Làn Canonical Pipeline

- **Nguồn Dữ Liệu Thật**: Tích hợp trực tiếp với GitHub CLI (`gh issue list`) và GitLab CLI (`glab issue list`). Không tạo các thư mục mock local rác (như `.issues/`).
- **7 Làn Trạng Thái Chuẩn (Matt Pocock + Review)**:
  1. `needs-triage`: Triage Agent phân loại ban đầu.
  2. `needs-info`: Bổ sung thông tin, phân tích 2 chiều Pro/Con.
  3. `ready-for-agent`: Đã có Spec đầy đủ (`/to-spec`), sẵn sàng lập trình.
  4. `in-progress`: Coder Agent đang viết code + TDD trong Git Worktree cô lập (`/implement`, `/tdd`).
  5. `review`: Hội đồng 3 Agent Review độc lập (Syntax + Feedback Verifier + Architecture).
  6. `ready-for-human`: PR đã mở, code & diff sẵn sàng cho con người duyệt merge (`/code-review`).
  7. `done`: Đã merge vào nhánh chính.
- **Chế Độ Xem Kép (Dual-View)**:
  Cung cấp cả chế độ **[ ☷ Board View ]** (Kanban kéo thả) và **[ ☰ List View ]** (Bảng danh sách tương tự màn hình Tasks của Orca) để mang lại trải nghiệm tiện dụng tối đa.
