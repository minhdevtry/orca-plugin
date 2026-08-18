# 🐳 Orca ADE Native Multi-Agent Orchestration Playbook
> **Quy Chuẩn Điều Phối Đa Tác Tử Thuần Bản Địa 100% Cho Orca ADE**
> *Hợp nhất: Orca Native Orchestration Protocol + Bộ Kỹ Năng Matt Pocock (`mattpocock/skills`) + Phi Đội 3 Tác Tử (Claude 3.7/Sonnet 5, MiniMax-M3, Antigravity `agy`)*

---

## 1. 🏗️ Tổng Quan Kiến Trúc Tam Hợp (The Trinity Architecture)

Hệ thống vận hành dựa trên sự kết hợp hoàn hảo giữa 3 trụ cột:
1. **Hạ Tầng Điều Phối Bản Địa của Orca (`orca orchestration`)**: Quản lý phiên làm việc (`Runs`), định danh tác vụ (`task_...`), khóa chốt chặn (`Decision Gates`), hàng đợi tin nhắn (`check --wait`) và hợp đồng hoàn thành (`worker_done`).
2. **Bộ Kỹ Năng Chuẩn Matt Pocock (`mattpocock/skills`)**: Chuẩn hóa tư duy kỹ thuật theo các slash command chuyên dụng: `/triage`, `/to-spec`, `/research`, `/implement`, `/tdd`, `/code-review`, `/finishing-a-development-branch`.
3. **Phi Đội 3 Tác Tử Chuyên Biệt (Specialized Agent Fleet)**:
   - **Claude Official (Sonnet 5 / Claude Team)**: Triage, Phân tích nghiệp vụ, Viết Spec kỹ thuật & Lead Coordinator.
   - **MiniMax-M3 (Custom Gateway)**: Lập trình siêu tốc, Viết Unit Test TDD & Quét cú pháp.
   - **Antigravity CLI (`agy` - Gemini 3.7 Flash High)**: Nghiên cứu kỹ thuật Pro/Con, Soi kiến trúc & Thẩm định review.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          ORCA SCHEDULED AUTOMATIONS (Trigger)                          │
│     Quét GitHub Issue mỗi 3 phút qua `--precheck` siêu nhẹ (0 token / 0 RAM)          │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ (Đánh thức khi có Issue mới)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LEAD AGENT / COORDINATOR TRONG ORCA                             │
│       Điều hành `orca orchestration run-create` và các Matt Pocock Skills              │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
│     CLAUDE OFFICIAL       │ │       MINIMAX-M3          │ │    ANTIGRAVITY (AGY)      │
│ Profile: Sonnet 5 (Team)  │ │ Profile: MiniMax-M3       │ │ Profile: Gemini 3.7 Flash │
│ Skills: /triage, /to-spec │ │ Skills: /implement, /tdd  │ │ Skills: /research, Arch   │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
```

---

## 2. 🤖 3 Hồ Sơ Lệnh Khởi Chạy Tác Tử Chuẩn (Agent Profiles)

Khi khởi chạy các tác tử trong Git Worktree con, Lead Agent luôn sử dụng cú pháp lệnh sau:

### 🔹 Profile A: Claude Code Official (Sonnet 5) — *Dành cho Triage, Spec & Lead*
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

## 3. 🔄 Quy Trình 6 Giai Đoạn Tự Trị Hợp Nhất (6-Stage Integrated Lifecycle)

Mỗi Issue trên GitHub/GitLab sẽ đi qua 6 giai đoạn nghiêm ngặt, kết hợp giữa lệnh `orca orchestration` và `mattpocock/skills`:

```
[1. Issue Mới] ──> [needs-triage: /triage & /to-spec] ──> [2. Run & Task: orca orchestration]
                                                                        │
┌───────────────────────────────────────────────────────────────────────┘
▼
[3. in-progress: /implement & /tdd] ──> [4. Verify: npm test (≤3 retries)]
                                                        │
┌───────────────────────────────────────────────────────┘
▼
[5. Decision Gate: /code-review (3 Agents)] ──> [6. ready-for-human: /finishing & PR]
```

---

### 📍 GIAI ĐOẠN 1: Phân Loại & Viết Spec Kỹ Thuật (`needs-triage`)
* **Tác tử phụ trách**: Claude Official (Sonnet 5).
* **Kỹ năng Matt Pocock**: `/triage` + `/to-spec`.
* **Thực hiện**:
  1. Lấy thông tin issue:
     ```bash
     gh issue view <issue-number> --json number,title,body
     ```
  2. Đồng bộ trạng thái:
     ```bash
     orca worktree set --worktree active --issue <id> --workspace-status needs-triage --comment "Đang phân loại và viết spec kỹ thuật" --json
     gh issue edit <id> --add-label "needs-triage"
     ```
  3. Kích hoạt skill:
     - Phân tích 3 góc nhìn: **Đồng thuận (Consensus)**, **Rủi ro (Risk)**, **Đột phá (Breakthrough)**.
     - Sinh file `spec.md` chi tiết: mô tả phạm vi thay đổi, interface design và danh sách file cần sửa.

---

### 📍 GIAI ĐOẠN 2: Khởi Tạo Phiên Điều Phối Native (`orca orchestration`)
Lead Agent đăng ký phiên làm việc và task vào hạ tầng Orca:
```bash
# 1. Tạo Orchestration Run:
RUN_ID=$(orca orchestration run-create --objective "Thực thi task #<id>: <title>" --json | jq -r .result.run.id)

# 2. Tạo Orchestration Task:
TASK_ID=$(orca orchestration task-create --spec "Bám sát spec.md để lập trình tính năng" --task-title "Task #<id>" --json | jq -r .result.task.id)

# 3. Tạo Git Worktree độc lập cho task:
orca worktree create --name "agent/task-<id>" --setup run --json
```

---

### 📍 GIAI ĐOẠN 3: Lập Trình & TDD Trong Worktree Con (`in-progress`)
* **Tác tử phụ trách**: MiniMax-M3 (Coder) hoặc Claude Official.
* **Kỹ năng Matt Pocock**: `/implement` + `/tdd` (Red-Green-Refactor).
* **Thực hiện**:
  1. Khởi chạy Subagent Coder (MiniMax-M3) bằng Profile B, lấy `<childHandle>`.
  2. Đồng bộ trạng thái:
     ```bash
     orca worktree set --worktree "name:agent/task-<id>" --issue <id> --workspace-status in-progress --comment "MiniMax-M3 đang lập trình TDD" --json
     gh issue edit <id> --add-label "in-progress" --remove-label "needs-triage,ready-for-agent"
     ```
  3. Dispatch task vào terminal Subagent kèm contract `worker_done`:
     ```bash
     orca orchestration dispatch --task $TASK_ID --to <childHandle> --inject --json
     orca terminal send --terminal <childHandle> \
       --text "Nhiệm vụ của bạn: /implement task #<id>. Đọc kỹ spec.md, tuân thủ CONTEXT.md, viết unit test theo phương pháp /tdd và tạo các atomic commit." \
       --enter --json
     ```
  4. Lead Agent chờ Subagent hoàn thành lượt làm việc:
     ```bash
     orca terminal wait --terminal <childHandle> --for tui-idle --timeout-ms 600000 --json
     ```

---

### 📍 GIAI ĐOẠN 4: 🛡️ Bắt Buộc Kiểm Chứng Test & Vòng Lặp Sửa Lỗi (Self-Healing Loop)
> ⚠️ **QUY TẮC BẤT DI BẤT DỊCH (Evidence Before Assertions)**: Lead Agent KHÔNG ĐƯỢC tin lời báo cáo suông của Model. Phải trực tiếp chạy lệnh test trong worktree để lấy bằng chứng thực tế!

```bash
# Lead Agent thực thi test trực tiếp trong worktree con:
cd /home/minhdn3/orca/workspaces/orca-dhs/agent-task-<id>
npm test
```

* **Nếu `npm test` PASS (Exit Code = 0)**: Chuyển thẳng sang Giai Đoạn 5.
* **Nếu `npm test` FAIL**:
  - **Giới hạn số lần sửa**: Tối đa **3 lần** (`retryCount <= 3`).
  - Ghi nhận trạng thái:
    ```bash
    orca orchestration task-update --id $TASK_ID --status in-progress --result '{"retryCount": 1, "status": "retrying-test-failure"}' --json
    ```
  - Gửi log lỗi bắt Subagent Coder sửa lại theo skill `/diagnosing-bugs`:
    ```bash
    orca terminal send --terminal <childHandle> \
      --text "Unit test thất bại với lỗi sau: <dán-lỗi-ở-đây>. Hãy kích hoạt /diagnosing-bugs và sửa code để test pass hoàn toàn!" \
      --enter --json
    orca terminal wait --terminal <childHandle> --for tui-idle --timeout-ms 300000 --json
    ```
  - **Nếu sau 3 lần vẫn FAIL**:
    - Dừng task, chuyển nhãn sang `needs-info`.
    - Cập nhật: `orca worktree set --worktree active --workspace-status needs-info --comment "Test thất bại sau 3 lần thử"`
    - Gửi thông báo báo cáo cho con người can thiệp.

---

### 📍 GIAI ĐOẠN 5: 🔒 Khóa Decision Gate & Hội Đồng Review 3 Tác Tử
Lead Agent tạo một **Decision Gate** để khóa cứng task, bắt buộc phải có sự đồng thuận từ 3 góc nhìn theo skill `/code-review`:

```bash
# 1. Tạo Gate khóa task:
GATE_ID=$(orca orchestration gate-create --task $TASK_ID --question "Hội đồng 3 Agent có duyệt code task #<id> không?" --options '["yes","no"]' --json | jq -r .result.gate.id)
```

**Phân công Hội đồng 3 Agent theo 2 trục Review chuẩn Matt Pocock (`/code-review`):**
1. **MiniMax-M3**: Quét trục **Standards** (Syntax, TypeScript strictness, lint, formatting, typos).
2. **Antigravity CLI (`agy`)**: Quét trục **Architecture & Spec** (Tuân thủ `CONTEXT.md`, Deep module boundaries, lọc bỏ nhận xét ảo giác).
3. **Claude Official**: Đối chiếu tính năng đã code so với `spec.md` ban đầu.

**Mở khóa Gate khi hoàn tất:**
- Nếu cả 3 thông qua:
  ```bash
  orca orchestration gate-resolve --id $GATE_ID --resolution "yes" --json
  ```
- Nếu có điểm cần sửa nhỏ: Bắt Coder sửa ngay trong worktree rồi resolve gate.
- Giải phóng terminal worker:
  ```bash
  orca orchestration worker-release --dispatch <dispatchId> --json
  ```

---

### 📍 GIAI ĐOẠN 6: Hoàn Tất Branch & Mở Pull Request (`ready-for-human`)
* **Kỹ năng Matt Pocock**: `/finishing-a-development-branch` + `/resolving-merge-conflicts`.
* **Thực hiện**:
  1. Kiểm tra rebase và đẩy branch:
     ```bash
     git push origin minhdevtry/agent-task-<id>
     ```
  2. Mở Pull Request:
     ```bash
     gh pr create --title "feat: hoàn thành task #<id> - <title>" \
       --body "### 📋 Tóm Tắt Triển Khai
- Đã bám sát \`spec.md\` (/to-spec).
- Đã vượt qua 100% Unit Tests (/tdd).
- Đã được duyệt bởi Hội đồng 3 Tác tử (/code-review: MiniMax + Antigravity + Claude).
Closes #<id>"
     ```
  3. Đồng bộ trạng thái cuối cùng:
     ```bash
     orca worktree set --worktree active --issue <id> --workspace-status ready-for-human --comment "PR đã mở thành công, chờ con người duyệt merge" --json
     gh issue edit <id> --add-label "ready-for-human" --remove-label "in-progress"
     ```
  4. Mở trình xem Diff của Orca để con người review:
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
  --repo id:70e65d38-aacf-4e1a-ac05-ec42fa997247 \
  --missed-run-grace-minutes 30 \
  --enabled \
  --json
```

---

## 5. 🎯 Bảng Tra Cứu Trạng Thái & Kỹ Năng Tương Ứng (Cheat Sheet)

| Trạng Thái | Git Label | Orca Board Status | Matt Pocock Skill | Hành Động Đồng Bộ Của Agent |
| :--- | :--- | :--- | :--- | :--- |
| **Chờ phân loại** | `needs-triage` | `needs-triage` | `/triage`, `/to-spec` | `orca worktree set --workspace-status needs-triage` + `gh issue edit --add-label needs-triage` |
| **Cần thông tin** | `needs-info` | `needs-info` | `/research`, `/domain-modeling` | `orca worktree set --workspace-status needs-info` + `gh issue edit --add-label needs-info` |
| **Sẵn sàng code** | `ready-for-agent` | `ready-for-agent` | `/to-tickets` | `orca worktree set --workspace-status ready-for-agent` + `gh issue edit --add-label ready-for-agent` |
| **Đang làm việc** | `in-progress` | `in-progress` | `/implement`, `/tdd` | `orca worktree set --workspace-status in-progress` + `gh issue edit --add-label in-progress` |
| **Chờ duyệt PR** | `ready-for-human` | `ready-for-human` | `/finishing-a-development-branch` | `orca worktree set --workspace-status ready-for-human` + `gh issue edit --add-label ready-for-human` |
| **Hoàn thành** | (Closed) | `done` | `/handoff` | `orca worktree set --workspace-status Done` + `gh issue close <id>` |
| **Từ chối** | `wontfix` | `wontfix` | — | `orca worktree set --workspace-status wontfix` + `gh issue close <id> --reason "not planned"` |

---

## 6. 🛡️ Hợp Đồng Phân Định Vai Trò & Chống Đẻ Nhánh Vô Hạn (Worker Contract & Anti-Recursion)

Để tránh hiện tượng *"Hội chứng ai cũng muốn làm Sếp (Lead), không ai chịu làm Thợ (Worker)"* hoặc tác tử con tự ý đẻ thêm cháu chắt vô tận:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    QUY TẮC PHÂN BIỆT VAI TRÒ BẤT BIẾN                       │
│                                                                             │
│  1. LEAD COORDINATOR (Sếp):                                                 │
│     • Điều kiện: Chạy ở thư mục gốc (`main`) hoặc do Orca Automation bật.  │
│     • Quyền hạn: Mở Run, tạo Task, mở Worktree con, phân công & mở Gate.   │
│                                                                             │
│  2. LEAF WORKER (Thợ):                                                      │
│     • Điều kiện: Chạy ở Worktree con (`agent/task-...`) hoặc nhận Dispatch. │
│     • Trách nhiệm: TỰ TAY VIẾT CODE, TỰ SỬA FILE, TỰ CHẠY TEST TDD.        │
│     • Điều cấm kỵ: 🚫 CẤM GỌI `worktree create` HAY ĐẺ THÊM AGENT CON!      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📜 Điều Khoản Bắt Buộc Dành Cho Worker (Subagent):
1. **Cấm đẻ nhánh con**: Worker tuyệt đối **KHÔNG ĐƯỢC** gọi `orca worktree create`, `orca orchestration run-create`, hay `orca terminal create`.
2. **Trực tiếp thực thi (Hands-on Execution)**: Nhiệm vụ `/implement` hay `/tdd` bắt buộc bạn phải dùng các công cụ chỉnh sửa file (`edit`, `write`) và chạy lệnh (`npm test`) trực tiếp trên codebase hiện tại.
3. **Báo cáo và Dừng lại**: Khi hoàn thành hoặc thất bại, gửi tín hiệu `worker_done` đúng 1 lần:
   ```bash
   orca orchestration send --type worker_done --task-id <id> --dispatch-id <id> --outcome succeeded --subject "Đã hoàn thành" --body "Đã pass 100% unit tests" --json
   ```
   Sau đó **dừng lại ở dấu nhắc lệnh (idle)**, không tự ý nhận thêm việc hay khởi động tiến trình khác!

