# 📋 ORCA ECOSYSTEM & SKILLS MASTER CHECKLIST (TODO)

> **Mục đích tài liệu:** Bảng kiểm tra (Checklist / TODO List) tổng hợp toàn diện 100% tất cả các kỹ năng (Skills), công cụ (CLI Tools), tính năng nền tảng (ADE Features), tác tử hỗ trợ (Supported Agents), hệ thống điều phối đa tác tử (Multi-Agent Orchestration), và tích hợp hệ thống có trong toàn bộ hệ sinh thái **Orca ADE (`stablyai/orca`)**, **Orca Orchestration (`orca-orchestration`)**, **DSH HA Orchestrator (`dsh-ha-orchestrator`)**, cùng các tài nguyên tham khảo trong repo.

---

## 📑 MỤC LỤC
1. [🎯 1. BỘ KỸ NĂNG BẢN ĐỊA (ORCA BUNDLED SKILLS)](#1-bộ-kỹ-năng-bản-địa-orca-bundled-skills)
2. [🕹️ 2. BỘ CÔNG CỤ ĐIỀU KHIỂN DÒNG LỆNH (ORCA CLI SUBSYSTEMS)](#2-bộ-công-cụ-điều-khiển-dòng-lệnh-orca-cli-subsystems)
3. [🤖 3. HỆ THỐNG ĐIỀU PHỐI ĐA TÁC TỬ (MULTI-AGENT ORCHESTRATION & FLEET)](#3-hệ-thống-điều-phối-đa-tác-tử-multi-agent-orchestration--fleet)
4. [🛡️ 4. BỘ ĐIỀU PHỐI HA & PHỤC HỒI MÔ HÌNH (DSH HA ORCHESTRATOR)](#4-bộ-điều-phối-ha--phục-hồi-mô-hình-dsh-ha-orchestrator)
5. [🔌 5. DANH SÁCH 28+ AI CODING AGENTS ĐƯỢC HỖ TRỢ](#5-danh-sách-28-ai-coding-agents-được-hỗ-trợ)
6. [🖥️ 6. TÍNH NĂNG GIAO DIỆN & MÔI TRƯỜNG PHÁT TRIỂN (ADE & DESKTOP GUI)](#6-tính-năng-giao-diện--môi-trường-phát-triển-ade--desktop-gui)
7. [📱 7. ỨNG DỤNG DI ĐỘNG & HỆ THỐNG RELAY (MOBILE COMPANION & RELAY)](#7-ứng-dụng-di-động--hệ-thống-relay-mobile-companion--relay)
8. [🌐 8. COMPUTER USE & GIẢ LẬP THIẾT BỊ (EMULATORS)](#8-computer-use--giả-lập-thiết-bị-emulators)
9. [🔗 9. TÍCH HỢP HỆ THỐNG ISSUE TRACKERS & SCM](#9-tích-hợp-hệ-thống-issue-trackers--scm)
10. [📦 10. HỆ SINH THÁI PLUGIN & EXTENSIONS MARKETPLACE](#10-hệ-sinh-thái-plugin--extensions-marketplace)
11. [🔐 11. BẢO MẬT, AI-VAULT & MÔI TRƯỜNG CÔ LẬP (SANDBOX & VM RECIPES)](#11-bảo-mật-ai-vault--môi-trường-cô-lập-sandbox--vm-recipes)
12. [🧪 12. VÕ ĐÀI KIỂM ĐỊNH CHẤT LƯỢNG (QUALITY GAUNTLET & VERIFICATION)](#12-võ-đài-kiểm-định-chất-lượng-quality-gauntlet--verification)

---

## 🎯 1. BỘ KỸ NĂNG BẢN ĐỊA (ORCA BUNDLED SKILLS)
*Tập hợp các kỹ năng tiêu chuẩn được tích hợp sẵn trong Orca (vị trí: `ref/orca/skills/`, `ref/orca/skill-guides/`, `orca-orchestration/skills/`)*

- [ ] **`orca-cli`** (`skills/orca-cli/SKILL.md`)
  - [ ] Quản lý cây thư mục Git Worktrees (`orca worktree ...`)
  - [ ] Quản trị đa terminal, gửi/đọc/chờ tiến trình terminal (`orca terminal ...`)
  - [ ] Điều khiển trình duyệt nhúng Chromium (`orca browser ...`)
  - [ ] Quản lý và chia sẻ Artifacts công khai (`orca artifacts ...`)
  - [ ] Ghi chú / comment theo từng dòng diff của worktree
  - [ ] Quản trị và đồng bộ kỹ năng giữa các agent (`orca skills ...`)
- [ ] **`orchestration`** (`skills/orchestration/SKILL.md`)
  - [ ] Khởi tạo phiên điều phối cấp cao (`orca orchestration run-create`)
  - [ ] Tạo task độc lập với ID định danh duy nhất (`orca orchestration task-create`)
  - [ ] Khởi chạy worker với supervisory contract (`orca orchestration worker-start` / `dispatch --inject`)
  - [ ] Lắng nghe vòng lặp sự kiện `worker_done`, `escalation`, `heartbeat` (`orca orchestration check --wait`)
  - [ ] Giao tiếp luồng tin nhắn phân cấp (Threaded messaging / Ask-Reply)
  - [ ] Tạo và giải phóng cổng quyết định an toàn (`gate-create` / `gate-resolve`)
  - [ ] Thu hồi tài nguyên và đọc biên bản thực thi (`worker-release` / `worker-read`)
- [ ] **`computer-use`** (`skills/computer-use/SKILL.md`)
  - [ ] Liệt kê danh sách ứng dụng và cửa sổ đang mở (`orca computer list-apps`)
  - [ ] Đọc cây trợ năng Accessibility Tree của cửa sổ mục tiêu (`orca computer get-app-state`)
  - [ ] Chụp ảnh màn hình Desktop / Window (`orca computer screenshot`)
  - [ ] Tương tác chuột: Click, Double Click, Right Click, Drag & Drop
  - [ ] Tương tác phím: Typing, Key combinations, Hotkeys
  - [ ] Thao tác UI an toàn với cơ chế định tuyến hành động (Safe UI Action Routing)
- [ ] **`orca-emulator` (iOS Simulator)** (`skills/orca-emulator/SKILL.md`)
  - [ ] Điều khiển Apple Simulator thông qua engine `serve-sim`
  - [ ] Stream hình ảnh trực tiếp 60fps qua WebSocket vào Orca Emulator Pane
  - [ ] Tương tác cảm ứng: Taps, Multi-touch Gestures, Swipes, Typing
  - [ ] Điều khiển nút vật lý: Home, Volume, Power, Shake
  - [ ] Tiêm camera giả lập (Camera frame injection)
  - [ ] Quản lý quyền ứng dụng (Runtime permissions) & Đọc Accessibility Tree
- [ ] **`orca-emulator-android` (Android Device & AVD)** (`skills/orca-emulator-android/SKILL.md`)
  - [ ] Quản trị thiết bị Android qua `adb`, `emulator`, `avdmanager` (hỗ trợ Windows, Linux, macOS)
  - [ ] Liệt kê và khởi động máy ảo AVD (`orca emulator avd-list`, `orca emulator boot`)
  - [ ] Thao tác cảm ứng và phím cứng: Back, Home, Recents, Volume, Screen Rotation
  - [ ] Cài đặt / gỡ cài đặt / khởi chạy APK
  - [ ] Cấp quyền tự động (Runtime permissions granting)
  - [ ] Thu thập logcat và đọc phân tích cây giao diện Android UI
- [ ] **`orca-linear` / `linear-tickets`** (`skills/orca-linear/SKILL.md`)
  - [ ] Đọc ngữ cảnh ticket Linear liên kết (`orca linear issue --current --full`)
  - [ ] Tự động chuyển đổi trạng thái quy trình làm việc (Workflow States: Todo -> In Progress -> In Review -> Done)
  - [ ] Đính kèm link PR/MR trực tiếp vào Linear ticket (`orca linear attach`)
  - [ ] Triage công việc: Phân công assignee, gán priority, estimate point, due date, labels
  - [ ] Tự động tạo sub-task / follow-up ticket phân nhánh
- [ ] **`orca-per-workspace-env`** (`skills/orca-per-workspace-env/SKILL.md`)
  - [ ] Thiết lập môi trường thực thi ảo theo từng workspace (Cloud Sandboxes, VMs, Multipass, Docker)
  - [ ] Tạo snapshot base image có sẵn công cụ phát triển
  - [ ] Tạo snapshot xác thực tài khoản coding agent (Auth Snapshot)
  - [ ] Kiểm tra tính tương thích và cấu hình bằng `orca vm recipe doctor`
- [ ] **`orca-orchestration` (Matt Pocock Skills Suite Integration)** (`orca-orchestration/skills/orca-orchestration/SKILL.md`)
  - [ ] Tích hợp bộ kỹ năng chuẩn Matt Pocock: `/triage`, `/to-spec`, `/to-tickets`, `/implement`, `/tdd`, `/code-review`, `/diagnosing-bugs`, `/finishing-a-development-branch`
  - [ ] Quy tắc giới hạn độ sâu cây tác tử Non-Proliferation Rule (Độ sâu $\le 3$: Coordinator $\to$ Worker $\to$ Leaf Helper)
  - [ ] Cơ chế tự chữa lành lệch trạng thái (State Alignment & Desync Healing) đồng bộ giữa GitHub Issue và Orca Board

---

## 🕹️ 2. BỘ CÔNG CỤ ĐIỀU KHIỂN DÒNG LỆNH (ORCA CLI SUBSYSTEMS)
*Danh mục tất cả các lệnh CLI trong mã nguồn `ref/orca/src/cli/`*

- [ ] **Nhóm lệnh Cơ bản & Trạng thái (Core & Status)**
  - [ ] `orca status [--json]`: Kiểm tra trạng thái runtime, phiên bản, các worktree và agent đang chạy
  - [ ] `orca open [path]`: Mở workspace hoặc khởi động ứng dụng Orca
  - [ ] `orca ping`: Kiểm tra kết nối IPC tới tiến trình nền Orca
  - [ ] `orca serve`: Khởi chạy headless daemon phục vụ kết nối từ xa (Linux Server / Remote Box)
  - [ ] `orca doctor`: Chẩn đoán sức khỏe môi trường, các binary Git, PTY, Glibc
  - [ ] `orca diagnostics`: Xuất báo cáo chẩn đoán sự cố, log và snapshot bộ nhớ
- [ ] **Nhóm lệnh Quản trị Worktree & Dự án (Worktree & Project)**
  - [ ] `orca worktree create [branch] [--parent] [--target] [--linear-issue]`: Tạo worktree cô lập cho agent
  - [ ] `orca worktree list [--json]`: Liệt kê tất cả worktree, nhánh, trạng thái card và metadata
  - [ ] `orca worktree set --workspace-status <status>`: Cập nhật trạng thái worktree trên Kanban
  - [ ] `orca worktree remove <id> [--force]`: Xóa an toàn worktree đã hoàn thành
  - [ ] `orca worktree clean`: Dọn dẹp các worktree mồ côi hoặc không còn hoạt động
  - [ ] `orca worktree trash`: Di chuyển worktree vào thùng rác an toàn
  - [ ] `orca project list` / `orca repo list`: Xem thông tin repo và context thư mục
- [ ] **Nhóm lệnh Quản lý Terminal & Đa tiến trình (Terminal Management)**
  - [ ] `orca terminal list [--host-scope]`: Liệt kê các tab terminal đang hoạt động
  - [ ] `orca terminal create [--shell] [--cwd]`: Mở terminal mới trong worktree chỉ định
  - [ ] `orca terminal send <id> <command>`: Gửi câu lệnh hoặc chuỗi input vào terminal
  - [ ] `orca terminal read <id> [--lines]`: Đọc output scrollback của terminal
  - [ ] `orca terminal wait <id> [--pattern] [--timeout]`: Chờ terminal hoàn thành lệnh hoặc khớp regex
  - [ ] `orca terminal split`: Chia tách giao diện terminal (Horizontal/Vertical)
- [ ] **Nhóm lệnh Trình duyệt nhúng (Embedded Browser)**
  - [ ] `orca browser nav <url>`: Điều hướng trình duyệt đến URL
  - [ ] `orca browser tab [list|new|close|select]`: Quản lý các tab trình duyệt
  - [ ] `orca browser click <selector>`: Click vào phần tử HTML
  - [ ] `orca browser fill <selector> <text>`: Điền dữ liệu vào form input
  - [ ] `orca browser capture [--full-page]`: Chụp ảnh trang web hiện tại
  - [ ] `orca browser eval <code>`: Thực thi JavaScript trên ngữ cảnh trang web
  - [ ] `orca browser cookie [get|set|clear]`: Quản lý session cookies
  - [ ] `orca browser storage [get|set|clear]`: Quản lý LocalStorage/SessionStorage
  - [ ] `orca browser profile`: Quản lý profile người dùng và cache trình duyệt
- [ ] **Nhóm lệnh Điều khiển Máy tính (Computer Use)**
  - [ ] `orca computer capabilities`: Khám phá khả năng hỗ trợ OS hiện tại
  - [ ] `orca computer list-apps`: Liệt kê các ứng dụng đang chạy
  - [ ] `orca computer get-app-state`: Lấy chi tiết cây UI và toạ độ các widget
  - [ ] `orca computer screenshot`: Chụp màn hình phục vụ phân tích thị giác
  - [ ] `orca computer click --x <x> --y <y>`: Click toạ độ màn hình
  - [ ] `orca computer type <text>`: Gõ phím
  - [ ] `orca computer key-press <key>`: Nhấn phím nóng / tổ hợp phím
  - [ ] `orca computer drag --from-x --from-y --to-x --to-y`: Kéo thả chuột
- [ ] **Nhóm lệnh Máy ảo & Giả lập (Emulator & VM)**
  - [ ] `orca emulator list`: Liệt kê danh sách simulator / emulator khả dụng
  - [ ] `orca emulator boot <id>`: Khởi động máy ảo iOS / Android
  - [ ] `orca emulator install <path>`: Cài đặt app lên máy ảo
  - [ ] `orca emulator launch <bundleId|package>`: Mở app trên máy ảo
  - [ ] `orca emulator tap --x <x> --y <y>`: Chạm màn hình máy ảo
  - [ ] `orca emulator swipe --from --to`: Vuốt màn hình
  - [ ] `orca emulator logcat`: Xem logcat thiết bị Android
  - [ ] `orca vm recipe doctor`: Kiểm tra tính hợp lệ của file cấu hình VM
- [ ] **Nhóm lệnh Tự động hóa & Lịch trình (Automations)**
  - [ ] `orca automations list`: Xem danh sách kịch bản tự động hóa
  - [ ] `orca automations schedule --cron "..." --task "..."`: Lên lịch chạy định kỳ cho agent
  - [ ] `orca automations trigger <id>`: Kích hoạt chạy ngay một automation
  - [ ] `orca automations pause` / `orca automations resume`
- [ ] **Nhóm lệnh Artifacts & Chia sẻ Tài nguyên (Artifacts & Skill Sharing)**
  - [ ] `orca artifacts create --file <path>`: Tạo và xuất bản artifact
  - [ ] `orca artifacts list`: Liệt kê artifacts đã tạo trong session
  - [ ] `orca artifacts public-link <id>`: Lấy đường dẫn chia sẻ Markdown/HTML
  - [ ] `orca skills list`: Xem các kỹ năng đã cài đặt
  - [ ] `orca skills install <skill-name>`: Cài đặt kỹ năng từ marketplace
  - [ ] `orca skills share --to-agent <agent>`: Chia sẻ kỹ năng cho agent cụ thể
- [ ] **Nhóm lệnh Quản lý Tài khoản & Quota (Accounts & Quota Switcher)**
  - [ ] `orca account list`: Xem danh sách tài khoản Claude / Codex / OpenCode
  - [ ] `orca account switch <id>`: Chuyển đổi nhanh tài khoản không cần login lại
  - [ ] `orca account usage`: Kiểm tra số token đã dùng và thời gian reset rate-limit

---

## 🤖 3. HỆ THỐNG ĐIỀU PHỐI ĐA TÁC TỬ (MULTI-AGENT ORCHESTRATION & FLEET)
*Hạ tầng điều phối và phối hợp đa agent chuyên biệt (`orca-orchestration/` và `ref/orca/src/main/runtime/orchestration/`)*

- [ ] **Vòng đời phiên điều phối (Orchestration Lifecycle)**
  - [ ] Khởi tạo Run với mục tiêu rõ ràng (`run-create`)
  - [ ] Chia nhỏ mục tiêu thành các DAG Tasks độc lập (`task-create`)
  - [ ] Phân bổ worker vào Git Worktree cô lập (`worker-start` / `dispatch --inject`)
  - [ ] Giám sát liên tục với chu kỳ Heartbeat 15s (`check --wait`)
  - [ ] Xử lý yêu cầu trợ giúp và leo thang (`escalation`, `question`)
  - [ ] Xử lý phản hồi kết quả và đóng worker (`worker_done`, `worker-release`)
- [ ] **Phi đội Tác tử Chuyên biệt (Specialized 3-Agent Fleet)**
  - [ ] **Làn Lead Coordinator** (`Claude Sonnet 5 / Claude Team`): Triage issue, lập spec kiến trúc, điều hành Run
  - [ ] **Làn Fast Coder** (`MiniMax-M3 / Custom Gateway`): Code tốc độ cao, TDD Red-Green-Refactor, pass linter
  - [ ] **Làn Deep Research** (`Antigravity CLI agy / Gemini 3.7 Flash High`): Đọc doc, nghiên cứu Pro/Con, thẩm định khách quan
  - [ ] **Làn Cheap Tests** (`MiniMax / Grok`): Chạy test suite lặp đi lặp lại, quét regression
- [ ] **Cổng Quyết định An toàn (Decision Gates)**
  - [ ] Tạo Checkpoint yêu cầu hội đồng 3 agent phê duyệt (`gate-create`)
  - [ ] Thẩm định mù (Blind Adversarial Review): Antigravity đánh giá chỉ dựa trên 4 input khách quan
  - [ ] Mở khóa tạo Pull Request sau khi đạt đủ điều kiện (`gate-resolve`)
- [ ] **Bộ công cụ Quản trị Tiến trình (Process Safety & Relay)**
  - [ ] `scripts/relay-exec.mjs`: Quản lý tiến trình chạy nền, tự động dọn toàn bộ process-tree khi timeout
  - [ ] `scripts/safe-research.sh`: Chế độ Sandbox Read-Only tuyệt đối cho tác tử nghiên cứu
  - [ ] `fleet.json`: Định nghĩa cấu hình phần cứng, timeout và mô hình cho từng làn thực thi

---

## 🛡️ 4. BỘ ĐIỀU PHỐI HA & PHỤC HỒI MÔ HÌNH (DSH HA ORCHESTRATOR)
*Hệ thống chịu lỗi cao và các chế độ điều phối song song (`dsh-ha-orchestrator/`)*

- [ ] **5 Chế độ Điều phối Song song (5 Orchestration Modes)**
  - [ ] `fanout`: Chia nhỏ bài toán thành nhiều sub-tasks chạy song song, sau đó tổng hợp kết quả
  - [ ] `pipeline`: Chạy tuần tự theo các giai đoạn (Output giai đoạn trước làm Input giai đoạn sau)
  - [ ] `supervisor`: Các worker chạy song song, sau đó có Sub-Agent Giám sát (Supervisor) kiểm tra và merge
  - [ ] `map-reduce`: Chạy song song các tác vụ Map, sau đó một tác vụ Reduce tổng hợp dữ liệu
  - [ ] `router`: Một Sub-Agent định tuyến phân tích yêu cầu để chọn nhánh thực thi phù hợp nhất
- [ ] **Hạ tầng Tự phục hồi Lỗi Mô hình (Model Fault Recovery & HA)**
  - [ ] Tự động chuyển đổi mô hình dự phòng (Fallback Rotation Chain) khi API lỗi
  - [ ] Cơ chế Cooldown: Tạm ngừng gọi mô hình vừa gặp sự cố trong một khoảng thời gian
  - [ ] Cầu dao ngắt mạch cấp Provider (Provider-level Circuit Breaker) khi lỗi hàng loạt
  - [ ] Thăm dò phục hồi chi phí thấp (Low-cost Health Probing)
  - [ ] Khôi phục phiên làm việc bị gián đoạn theo `runId` (Resume Capability)
  - [ ] Quản lý ngân sách gọi mô hình cho từng sub-agent (Token/Cost Budget)

---

## 🔌 5. DANH SÁCH 28+ AI CODING AGENTS ĐƯỢC HỖ TRỢ
*Tất cả các dòng AI Agent chạy được trong terminal và giao diện Orca (`ref/orca/src/main/`)*

- [ ] **Nhóm Agent Flagship**
  - [ ] **Claude Code** (`src/main/claude/`): Hỗ trợ đầy đủ Claude Code CLI, token tracking, đa tài khoản
  - [ ] **OpenAI Codex** (`src/main/codex/`, `src/main/codex-cli/`): Tích hợp Codex CLI, usage rate limits
  - [ ] **Google Antigravity (`agy`)** (`src/main/antigravity/`): Gemini 3.7 Flash High / Pro CLI
  - [ ] **MiniMax Code** (`src/main/minimax/`): MiniMax-M3, M2.5 và Custom Gateway
  - [ ] **Google Gemini CLI** (`src/main/gemini/`): Tích hợp Gemini models
  - [ ] **xAI Grok** (`src/main/grok/`): Grok code CLI và quản lý tài khoản Grok
- [ ] **Nhóm Open-Source & Alternative Coding Agents**
  - [ ] **OpenCode** (`src/main/opencode/`): Mã nguồn mở, theo dõi token usage
  - [ ] **Pi / oh-my-pi (`omp.sh`)** (`src/main/pi/`): Trình trợ lý lập trình siêu nhẹ
  - [ ] **OpenClaude** (`src/main/openclaude/`): Bản mở rộng Claude tương thích cao
  - [ ] **Moonshot Kimi** (`src/main/kimi/`): Kimi Code CLI
  - [ ] **Devin CLI** (`src/main/devin/`): Tích hợp luồng thực thi Devin
  - [ ] **Hermes Agent** (`src/main/hermes/`): Trợ lý Nous Research
  - [ ] **Factory Droid** (`src/main/droid/`): Trợ lý Droid
  - [ ] **GitHub Copilot CLI** (`src/main/copilot/`): Hỗ trợ Copilot command line
  - [ ] **Cursor CLI** (`src/main/cursor/`): Tích hợp Cursor runtime
  - [ ] **Xiaomi MiMo Code** (`src/main/mimo/`): Trợ lý lập trình MiMo
  - [ ] **Amp Code** (`src/main/amp/`): Trình phát triển nhanh Amp
  - [ ] **Command Code** (`src/main/command-code/`)
  - [ ] **Goose** (Block): Agent mã nguồn mở chạy local
  - [ ] **Auggie** (Augment Code): Trợ lý ngữ cảnh mã nguồn lớn
  - [ ] **Autohand Code**
  - [ ] **Charm Crush** (Charmbracelet CLI)
  - [ ] **Cline CLI**
  - [ ] **Codebuff**
  - [ ] **Continue CLI**
  - [ ] **Kilocode**
  - [ ] **Kiro CLI**
  - [ ] **Mistral Vibe**
  - [ ] **Qwen Code** (Alibaba Qwen)
  - [ ] **Atlassian Rovo Dev**

---

## 🖥️ 6. TÍNH NĂNG GIAO DIỆN & MÔI TRƯỜNG PHÁT TRIỂN (ADE & DESKTOP GUI)
*Các thành phần giao diện máy tính được xây dựng trong `ref/orca/src/renderer/src/`*

- [ ] **Quản lý Không gian làm việc Song song (Parallel Worktrees View)**
  - [ ] Giao diện chia màn hình đa cột (Multi-column Split Screen)
  - [ ] Bảng Kanban hiển thị trực quan trạng thái từng Worktree (`needs-triage`, `in-progress`, `ready-for-review`, `done`)
  - [ ] Bộ chọn nhánh và quản lý lịch sử phân nhánh (Lineage Tracking)
  - [ ] Dọn dẹp dung lượng ổ đĩa của worktree (`workspace-space` & `workspace-cleanup`)
- [ ] **Terminal Đẳng cấp Ghostty (Ghostty-class WebGL Terminal)**
  - [ ] Bộ render WebGL mượt mà, tốc độ cao
  - [ ] Chia tách terminal vô hạn (Infinite horizontal/vertical splits)
  - [ ] Lưu trữ và phục hồi toàn bộ scrollback lịch sử lệnh qua các phiên khởi động lại
  - [ ] Bộ sưu tập theme phong phú (Warp themes, Dark/Light modes)
  - [ ] Menu lệnh tắt nhanh (Terminal Quick Commands)
- [ ] **Chế độ Thiết kế UI (Design Mode & Embedded Browser)**
  - [ ] Trình duyệt Chromium tích hợp sẵn ngay trong ADE
  - [ ] Tính năng **Design Mode**: Click vào bất kỳ phần tử UI nào trên trang web để tự động bóc tách mã HTML, CSS và chụp ảnh crop gửi thẳng vào prompt của Agent
  - [ ] Tích hợp trọn bộ Chrome DevTools, Console logs, Network inspector
- [ ] **Đánh dấu & Góp ý Diff Trực quan (Annotate AI Diffs)**
  - [ ] Đặt comment trực tiếp trên từng dòng diff code do AI tạo ra
  - [ ] Đóng gói toàn bộ comment thành feedback có cấu trúc gửi lại cho Agent sửa
  - [ ] Chấp nhận/từ chối từng hunk code (Interactive Hunk Staging)
- [ ] **Trình soạn thảo Monaco Editor nâng cao**
  - [ ] Tích hợp VS Code Monaco Editor với tính năng Auto-save toàn bộ
  - [ ] Hỗ trợ Kéo & Thả (Drag & Drop) file, ảnh trực tiếp vào khung chat của Agent
  - [ ] Trình xem trước tài liệu đa định dạng: Markdown, HTML, PDF, hình ảnh
- [ ] **Điều hướng Nhanh (Quick Open & Command Palette - `Cmd+J` / `Ctrl+J`)**
  - [ ] Tìm kiếm tức thì xuyên suốt các worktree, file, terminal, agent và lịch sử lệnh
- [ ] **Quản lý Tài khoản & Giám sát Quota (Account Switcher & Usage Bar)**
  - [ ] Widget hiển thị số token tiêu thụ theo thời gian thực (Claude, Codex, OpenCode)
  - [ ] Đếm ngược thời gian reset Rate-Limit
  - [ ] Đổi tài khoản 1-click mà không cần đăng xuất
- [ ] **Các tiện ích bổ trợ độc đáo**
  - [ ] **Thú cưng Desktop (Desk Pet / Mascot)** đồng hành khi code
  - [ ] **Voice Dictation (Nhận diện giọng nói)**: Đọc prompt bằng giọng nói
  - [ ] **Port Forwarding**: Tự động phát hiện và quản lý các cổng mạng (ports) đang mở
  - [ ] **Đa ngôn ngữ (i18n)**: Tiếng Anh, Tiếng Trung, Tiếng Nhật, Tiếng Hàn, Tiếng Tây Ban Nha, Tiếng Pháp, Tiếng Bồ Đào Nha

---

## 📱 7. ỨNG DỤNG DI ĐỘNG & HỆ THỐNG RELAY (MOBILE COMPANION & RELAY)
*Hạ tầng ứng dụng di động iOS/Android và kết nối máy chủ Relay (`ref/orca/mobile/` & `ref/orca/src/relay/`)*

- [ ] **Ứng dụng Di động Orca Companion (React Native / Expo)**
  - [ ] Cài đặt qua iOS App Store, TestFlight hoặc file APK Android
  - [ ] Quét mã QR trên màn hình Desktop để ghép nối thiết bị tức thì
  - [ ] Xem danh sách các agent đang chạy theo thời gian thực
  - [ ] Nhận thông báo đẩy (Push Notifications) ngay khi Agent hoàn thành việc hoặc cần trợ giúp
  - [ ] Nhập lệnh và chỉ đạo agent trực tiếp từ điện thoại (Mobile Direct Input)
  - [ ] Truyền trực tiếp luồng output terminal mượt mà (Terminal Output Streaming)
- [ ] **Hạ tầng Relay Khu vực (Regional Relay Network)**
  - [ ] Định tuyến kết nối an toàn qua máy chủ Relay gần nhất để giảm độ trễ
  - [ ] Tự động chuyển tiếp WebSocket giữa desktop và mobile
  - [ ] Mã hóa đầu cuối kênh truyền thông tin

---

## 🌐 8. COMPUTER USE & GIẢ LẬP THIẾT BỊ (EMULATORS)
*Khả năng tương tác trực tiếp với hệ điều hành và thiết bị di động (`ref/orca/native/` & `ref/orca/src/main/emulator/`)*

- [ ] **Hệ thống Native Computer Use**
  - [ ] `native/computer-use-macos`: Tương tác macOS Accessibility API & ScreenCaptureKit
  - [ ] `native/computer-use-windows`: Tương tác Windows UI Automation API
  - [ ] `native/computer-use-linux`: Tương tác X11 / Wayland & AT-SPI
  - [ ] `native/keyboard-layout-macos`: Hỗ trợ chuẩn hóa layout bàn phím đa quốc gia
  - [ ] `native/notification-status-macos`: Đồng bộ trạng thái Do Not Disturb / Focus Mode
- [ ] **Hệ thống Giả lập Thiết bị (Live Mobile Emulators)**
  - [ ] iOS Simulator Framebuffer Capture (H.264 / MJPEG qua IOSurface độ trễ cực thấp)
  - [ ] Android AVD Controller (Điều khiển sâu hệ thống qua ADB Shell Input)
  - [ ] Live visual pane nhúng trong ADE vừa xem vừa điều khiển

---

## 🔗 9. TÍCH HỢP HỆ THỐNG ISSUE TRACKERS & SCM
*Kết nối trực tiếp các nền tảng quản lý dự án và mã nguồn (`ref/orca/src/main/`)*

- [ ] **GitHub Integration (`src/main/github/`)**
  - [ ] Duyệt danh sách Issues, Pull Requests và GitHub Project Boards ngay trong app
  - [ ] Mở nhanh một Git Worktree mới từ bất kỳ GitHub Issue nào
  - [ ] Tối ưu hóa request API của GitHub CLI (`gh`) tránh chạm trần Rate-Limit
- [ ] **Linear Integration (`src/main/linear/`)**
  - [ ] Đồng bộ 2 chiều với Linear qua GraphQL và Linear MCP Server
  - [ ] Đọc full context mô tả issue, comments, labels, custom fields
  - [ ] Tự động tạo quan hệ liên kết và đính kèm đường dẫn Pull Request
- [ ] **GitLab Integration (`src/main/gitlab/`)**: Hỗ trợ Merge Requests, Issues và GitLab CI
- [ ] **Jira Integration (`src/main/jira/`)**: Đồng bộ Jira Issues và Kanban Agile
- [ ] **Bitbucket (`src/main/bitbucket/`)**, **Gitea (`src/main/gitea/`)**, **Azure DevOps (`src/main/azure-devops/`)**
- [ ] **Bảng điều khiển Source Control**: Staging, Commit message AI generation, Push/Pull, Stash, Resolve Conflicts

---

## 📦 10. HỆ SINH THÁI PLUGIN & EXTENSIONS MARKETPLACE
*Khả năng mở rộng qua plugin của Orca (`ref/orca/resources/plugins/` & `ref/orca/examples/plugins/`)*

- [ ] **Thị trường Plugin chính thức (Official Plugin Marketplace)**
  - [ ] `stablyai.orca-navigation-shortcuts`: Phím tắt và lệnh alias tùy biến
  - [ ] `stablyai.orca-multipass-recipes`: Bộ công thức dựng môi trường máy ảo Multipass
  - [ ] `stablyai.orca-portuguese`: Gói ngôn ngữ tiếng Bồ Đào Nha
- [ ] **Kiến trúc Plugin Mở (Extensible Plugin Architecture)**
  - [ ] Khai báo manifest `orca-plugin.json`
  - [ ] Hỗ trợ nhúng giao diện Webview Panels độc lập (`panel.html`)
  - [ ] Giao tiếp bảo mật giữa Plugin và Host ADE
  - [ ] Cài đặt plugin từ Git repository hoặc thư mục cục bộ

---

## 🔐 11. BẢO MẬT, AI-VAULT & MÔI TRƯỜNG CÔ LẬP (SANDBOX & VM RECIPES)
*Cơ chế bảo vệ mã nguồn, cô lập tiến trình và bảo mật danh tính (`ref/orca/docs/` & `ref/orca/src/main/ai-vault/`)*

- [ ] **AI-Vault & Process Isolation**
  - [ ] Cô lập tiến trình agent trong môi trường sandbox ngăn chặn truy cập tệp nhạy cảm
  - [ ] Bảo vệ API Keys và SSH Keys không bị rò rỉ vào context prompt của LLM
  - [ ] Fencing vùng nhớ và dọn dẹp biến môi trường sau mỗi phiên làm việc
- [ ] **Kết nối SSH Remote Worktrees An toàn**
  - [ ] Tự động kết nối lại (Auto-reconnect) khi mạng chập chờn
  - [ ] Kiểm tra và xác thực SSH Host Key an toàn
  - [ ] Port Forwarding bảo mật từ server từ xa về máy local
- [ ] **Công thức Môi trường Riêng (Per-Workspace VM Recipes - `orca.yaml`)**
  - [ ] Tự động dựng môi trường phát triển sạch sẽ (Disposable Runtimes) cho từng task
  - [ ] Quản lý snapshot trạng thái môi trường và cấu hình xác thực

---

## 🧪 12. VÕ ĐÀI KIỂM ĐỊNH CHẤT LƯỢNG (QUALITY GAUNTLET & VERIFICATION)
*Các công cụ kiểm tra tự động trước khi merge code (`orca-orchestration/scripts/` & `dsh-ha-orchestrator/scripts/`)*

- [ ] **Quality Gauntlet (`scripts/run-gauntlet.sh`)**
  - [ ] Quét lỗi mã nguồn với Linter đa tầng (Oxlint / ESLint)
  - [ ] Đo lường độ bao phủ kiểm thử trên các dòng code thay đổi (Changed-Line Coverage $\ge 90\%$)
  - [ ] Kiểm thử đột biến (Mutation Testing với Stryker) bảo đảm test không viết hình thức
- [ ] **9 Cổng Thiết Kế API (API Design Gates)**
  - [ ] Kiểm tra tính độc lập, đóng gói và khả năng bảo trì của API trước khi viết code
- [ ] **Tự động Chạy Kiểm thử Toàn diện (Continuous Verification)**
  - [ ] 219+ test cases kiểm tra khả năng phục hồi HA (`dsh-ha-orchestrator/docs/verification.md`)
  - [ ] E2E Playwright tests kiểm tra tương tác UI Electron

---

## 📌 HƯỚNG DẪN SỬ DỤNG CHECKLIST NÀY

1. **Khi bắt đầu một Task mới:**
   - Dùng lệnh `orca worktree create` để mở một branch riêng.
   - Chọn Skill tương ứng trong mục **1** hoặc **3**.
2. **Khi mở rộng tính năng:**
   - Đánh dấu `[x]` vào các tính năng đã được hiện thực hóa hoặc đã kiểm thử thành công.
3. **Khi cần tra cứu nhanh:**
   - Sử dụng mục lục phía trên để nhảy trực tiếp đến hệ thống con cần tham chiếu.
