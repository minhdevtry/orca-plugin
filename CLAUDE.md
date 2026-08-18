# 🐳 Orca ADE Native Multi-Agent Orchestration Playbook
> **Quy Chuẩn Điều Phối Đa Tác Tử Thuần Bản Địa 100% Cho Orca ADE** (Zero-Plugin / Zero-Script Architecture)

---

## 1. 🏗️ Tổng Quan Kiến Trúc (Architecture Overview)

Dự án sử dụng **100% Hạ tầng Bản địa của Orca ADE** kết hợp cùng **GitHub/GitLab CLI** để vận hành một phi đội tác tử tự trị (Autonomous Multi-Agent Fleet). Không cần cài đặt plugin ngoài hay script phức tạp.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          ORCA SCHEDULED AUTOMATIONS (Trigger)                          │
│     Quét GitHub Issue mỗi 3-5 phút qua `--precheck` siêu nhẹ (0 token / 0 RAM)        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ (Đánh thức khi có Issue mới)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LEAD AGENT (Tác Tử Tổng Chỉ Huy trong Orca)                     │
│               Điều hành toàn bộ quy trình qua bộ lệnh `orca orchestration`             │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
│     CLAUDE OFFICIAL       │ │       MINIMAX-M3          │ │    ANTIGRAVITY (AGY)      │
│ Model: Sonnet 3.7 (Team)  │ │ Model: MiniMax-M3         │ │ Model: Gemini 3.7 Flash   │
│ Vai trò: Triage & Spec    │ │ Vai trò: Coder & TDD      │ │ Vai trò: Research & Arch  │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
```

---

## 2. 🤖 3 Hồ Sơ Tác Tử Chuẩn (Agent Profiles)

Khi khởi chạy các tác tử trong Git Worktree con, Lead Agent luôn sử dụng cú pháp lệnh sau:

### 🔹 Profile A: Claude Code Official (Sonnet 3.7) — *Dành cho Triage, Spec & Lead*
```bash
orca terminal create \
  --worktree "name:agent/task-<id>" \
  --title "Official Claude" \
  --command "unset ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_SMALL_FAST_MODEL CLAUDE_CONFIG_DIR && claude --permission-mode bypassPermissions --dangerously-skip-permissions" \
  --focus --json
```

### 🔹 Profile B: MiniMax-M3 (Custom Gateway) — *Dành cho Lập Trình Siêu Tốc & TDD*
```bash
orca terminal create \
  --worktree "name:agent/task-<id>" \
  --title "MiniMax-M3" \
  --command 'export ANTHROPIC_BASE_URL="https://aiapi.2tocom.space" && export ANTHROPIC_API_KEY="sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU" && export ANTHROPIC_MODEL="MiniMax-M3" && export CLAUDE_CONFIG_DIR="$HOME/.claude-ide" && claude --permission-mode bypassPermissions --dangerously-skip-permissions' \
  --focus --json
```

### 🔹 Profile C: Google Antigravity CLI (`agy`) — *Dành cho Nghiên Cứu & Soi Kiến Trúc*
```bash
orca terminal create \
  --worktree "name:agent/task-<id>" \
  --title "worker-agy" \
  --command "agy --model gemini-3.7-flash-high --dangerously-skip-permissions" \
  --focus --json
```

---

## 3. 🔄 Quy Trình 6 Giai Đoạn Tự Trị (6-Stage Autonomous Pipeline)

Lead Agent **BẮT BUỘC** thực thi đầy đủ và tuần tự 6 bước sau, không được phép nhảy cóc:

### 📍 GIAI ĐOẠN 1: Tiếp Nhận Issue & Phân Tích Kỹ Thuật (`needs-triage`)
1. **Lấy thông tin issue**:
   ```bash
   gh issue view <issue-number> --json number,title,body
   ```
2. **Đồng bộ trạng thái**:
   ```bash
   orca worktree set --worktree active --issue <id> --workspace-status needs-triage --comment "Đang phân tích issue và viết spec kỹ thuật" --json
   gh issue edit <id> --add-label "needs-triage"
   ```
3. **Chạy kỹ năng `/triage` & `/to-spec`**:
   - Phân tích 3 góc nhìn (Đồng thuận, Rủi ro, Đột phá).
   - Tạo file `spec.md` mô tả chi tiết giải pháp và danh sách file cần sửa.

---

### 📍 GIAI ĐOẠN 2: Khởi Tạo Phiên Điều Phối (`orca orchestration`)
Lead Agent đăng ký phiên làm việc và task vào hệ thống Orca Native:
```bash
# 1. Tạo Orchestration Run:
RUN_ID=$(orca orchestration run-create --objective "Thực thi task #<id>: <title>" --json | jq -r .result.run.id)

# 2. Tạo Orchestration Task:
TASK_ID=$(orca orchestration task-create --spec "Bám sát spec.md để lập trình tính năng" --task-title "Task #<id>" --json | jq -r .result.task.id)

# 3. Tạo Git Worktree độc lập cho task:
orca worktree create --name "agent/task-<id>" --json
```

---

### 📍 GIAI ĐOẠN 3: Lập Trình & TDD Trong Worktree Con (`in-progress`)
1. **Khởi chạy Subagent Coder (MiniMax-M3)** trong worktree con:
   *(Dùng Profile B ở trên để mở terminal và lấy `<childHandle>`)*
2. **Đồng bộ trạng thái**:
   ```bash
   orca worktree set --worktree "name:agent/task-<id>" --issue <id> --workspace-status in-progress --comment "MiniMax-M3 đang lập trình TDD" --json
   gh issue edit <id> --add-label "in-progress" --remove-label "needs-triage,ready-for-agent"
   ```
3. **Giao việc cho Subagent Coder**:
   ```bash
   orca terminal send --terminal <childHandle> \
     --text "Nhiệm vụ của bạn: /implement task #<id>. Đọc kỹ spec.md, tuân thủ CONTEXT.md, viết unit test theo phương pháp /tdd và tạo các atomic commit." \
     --enter --json
   ```
4. **Lead Agent đợi Subagent hoàn thành lượt làm việc**:
   ```bash
   orca terminal wait --terminal <childHandle> --for tui-idle --timeout-ms 600000 --json
   ```

---

### 📍 GIAI ĐOẠN 4: 🛡️ Bắt Buộc Kiểm Chứng Test & Vòng Lặp Tự Sửa Lỗi (Self-Healing Loop)
> ⚠️ **QUY TẮC BẤT DI BẤT DỊCH (Evidence Before Assertions)**: Lead Agent KHÔNG ĐƯỢC tin lời báo cáo suông của Model. Phải trực tiếp chạy lệnh test trong worktree để xác thực!

```bash
# Lead Agent thực thi test trực tiếp trong worktree con:
cd /home/minhdn3/orca/workspaces/orca-dhs/agent-task-<id>
npm test
```

- **Nếu `npm test` PASS (Exit Code = 0)**: Chuyển thẳng sang Giai Đoạn 5.
- **Nếu `npm test` FAIL**:
  - **Giới hạn số lần sửa**: Tối đa **3 lần** (`retryCount <= 3`).
  - Gửi log lỗi bắt Subagent Coder sửa lại:
    ```bash
    orca terminal send --terminal <childHandle> \
      --text "Unit test thất bại với lỗi sau: <dán-lỗi-ở-đây>. Hãy sửa lại code để test pass hoàn toàn!" \
      --enter --json
    orca terminal wait --terminal <childHandle> --for tui-idle --timeout-ms 300000 --json
    ```
  - **Nếu sau 3 lần vẫn FAIL**:
    - Dừng task, chuyển nhãn sang `needs-info`.
    - Cập nhật: `orca worktree set --worktree active --workspace-status needs-info --comment "Test thất bại sau 3 lần thử"`
    - Gửi thông báo báo cáo cho con người can thiệp.

---

### 📍 GIAI ĐOẠN 5: 🔒 Khóa Decision Gate & Hội Đồng Review 3 Tác Tử
Lead Agent tạo một **Decision Gate** để khóa task, bắt buộc phải có sự đồng thuận từ 3 góc nhìn:

```bash
# 1. Tạo Gate khóa task:
GATE_ID=$(orca orchestration gate-create --task $TASK_ID --question "Hội đồng 3 Agent có duyệt code task #<id> không?" --options '["yes","no"]' --json | jq -r .result.gate.id)
```

**Phân công Hội đồng 3 Agent:**
1. **MiniMax-M3**: Quét cú pháp, type errors, lint, formatting.
2. **Antigravity CLI (`agy`)**: Quét kiến trúc, tuân thủ `CONTEXT.md`, lọc bỏ các nhận xét ảo giác.
3. **Claude Official**: Đối chiếu tính năng đã code so với `spec.md` ban đầu.

**Mở khóa Gate khi hoàn tất:**
- Nếu cả 3 thông qua:
  ```bash
  orca orchestration gate-resolve --id $GATE_ID --resolution "yes" --json
  ```
- Nếu có điểm cần sửa nhỏ: Bắt Coder sửa ngay trong worktree rồi resolve gate.

---

### 📍 GIAI ĐOẠN 6: Mở Pull Request & Đồng Bộ Trạng Thái (`ready-for-human`)
1. **Đẩy branch và tạo Pull Request**:
   ```bash
   git push origin minhdevtry/agent-task-<id>
   gh pr create --title "feat: hoàn thành task #<id> - <title>" \
     --body "### 📋 Tóm Tắt Triển Khai
- Đã bám sát \`spec.md\`.
- Đã vượt qua 100% Unit Tests (\`/tdd\`).
- Đã được duyệt bởi Hội đồng 3 Tác tử (MiniMax + Antigravity + Claude).
Closes #<id>"
   ```
2. **Đồng bộ trạng thái cuối cùng**:
   ```bash
   orca worktree set --worktree active --issue <id> --workspace-status ready-for-human --comment "PR đã mở thành công, chờ con người duyệt merge" --json
   gh issue edit <id> --add-label "ready-for-human" --remove-label "in-progress"
   ```
3. **Mở trình xem Diff của Orca để con người review**:
   ```bash
   orca file open-changed --mode diff --worktree "name:agent/task-<id>" --json
   ```

---

## 4. ⏰ Kích Hoạt Tự Động Định Kỳ (Orca Scheduled Automations)

Để hệ thống tự động thức giấc khi có issue mới trên GitHub mà không cần bật tay:

```bash
orca automations create \
  --name "AutoPilot Autonomous Issue Runner" \
  --trigger "*/3 * * * *" \
  --timezone "Asia/Ho_Chi_Minh" \
  --precheck "gh issue list --repo minhdevtry/orca-plugin --state open --label needs-triage,ready-for-agent --json number -q '.[0].number' | grep -q '^[0-9]'" \
  --prompt "Bạn là Lead Agent. Hãy kiểm tra các issue mới trên repo, bám sát AGENTS.md để khởi tạo run, mở worktree con, giao việc cho MiniMax/AGY và chạy đầy đủ quy trình 6 giai đoạn." \
  --provider claude \
  --repo minhdevtry/orca-plugin \
  --missed-run-grace-minutes 30 \
  --enabled \
  --json
```

---

## 5. 🎯 Bảng Tra Cứu Trạng Thái & Lệnh Đồng Bộ (Cheat Sheet)

| Trạng Thái | Git Label | Orca Board Status | Hành Động Đồng Bộ Của Agent |
| :--- | :--- | :--- | :--- |
| **Chờ phân loại** | `needs-triage` | `needs-triage` | `orca worktree set --workspace-status needs-triage` + `gh issue edit --add-label needs-triage` |
| **Cần thông tin** | `needs-info` | `needs-info` | `orca worktree set --workspace-status needs-info` + `gh issue edit --add-label needs-info` |
| **Sẵn sàng code** | `ready-for-agent` | `ready-for-agent` | `orca worktree set --workspace-status ready-for-agent` + `gh issue edit --add-label ready-for-agent` |
| **Đang làm việc** | `in-progress` | `in-progress` | `orca worktree set --workspace-status in-progress` + `gh issue edit --add-label in-progress` |
| **Chờ duyệt PR** | `ready-for-human` | `ready-for-human` | `orca worktree set --workspace-status ready-for-human` + `gh issue edit --add-label ready-for-human` |
| **Hoàn thành** | (Closed) | `completed` | `orca worktree set --workspace-status completed` + `gh issue close <id>` |
| **Từ chối** | `wontfix` | `wontfix` | `orca worktree set --workspace-status wontfix` + `gh issue close <id> --reason "not planned"` |
