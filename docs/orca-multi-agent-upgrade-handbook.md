# 🐳 SỔ TAY KỸ THUẬT: NÂNG CẤP & CẢI TIẾN ĐIỀU PHỐI ĐA TÁC TỬ TRONG ORCA ADE
*(Tài liệu chuẩn hóa triển khai và thực thi trên mọi môi trường Orca ADE)*

> **Dự án:** `minhdevtry/orca-plugin`  
> **Mục tiêu:** Nâng cấp độ ổn định, quản trị tiến trình, bảo mật thực thi, võ đài kiểm thử cực đoan và tối ưu hóa chi phí token cho hệ thống Điều phối Đa Tác tử Tự hành trên Orca ADE.  
> **Tham chiếu kỹ thuật:** Tinh hoa kiến trúc từ `amElnagdy/delegate-skills` + Võ đài kiểm định chất lượng `AmazingAng/old-coder` + Quy trình 36 kỹ năng Matt Pocock.

---

## 📌 MỤC LỤC
1. [Tóm tắt Các Điểm Nghẽn & Hướng Khắc Phục](#1-tóm-tắt-các-điểm-nghẽn--hướng-khắc-phục)
2. [Hạng Mục 1: Wrapper An Toàn Tiến Trình (`scripts/relay-exec.mjs`)](#2-hạng-mục-1-wrapper-an-toàn-tiến-trình-scriptsrelay-execmjs)
3. [Hạng Mục 2: Chuẩn Hóa Hợp Đồng Kết Quả (`run_result.json`)](#3-hạng-mục-2-chuẩn-hóa-hợp-đồng-kết-quả-run_resultjson)
4. [Hạng Mục 3: Cơ Chế Bẫy Vi Phạm Read-Only (`scripts/safe-research.sh`)](#4-hạng-mục-3-cơ-chế-bẫy-vi-phạm-read-only-scriptssafe-researchsh)
5. [Hạng Mục 4: Mở Rộng Cấu Hình Fleet Lanes (`fleet.json`)](#5-hạng-mục-4-mở-rộng-cấu-hình-fleet-lanes-fleetjson)
6. [Hạng Mục 5: Tinh Chỉnh State Healing & Fix-in-Place ($\le 5$ dòng)](#6-hạng-mục-5-tinh-chỉnh-state-healing--fix-in-place-le-5-dòng)
7. [Hạng Mục 6: Võ Đài Thử Thách Gauntlet & Mutation Testing (`scripts/run-gauntlet.sh`)](#7-hạng-mục-6-võ-đài-thử-thách-gauntlet--mutation-testing-scriptsrun-gauntletsh)
8. [Hạng Mục 7: Giao Thức Thẩm Định Mù (Blind Adversarial Verification)](#8-hạng-mục-7-giao-thức-thẩm-định-mù-blind-adversarial-verification)
9. [Hạng Mục 8: 9 Cổng Thiết Kế API (`old-coder-api`) vào Phase 1 (`/to-spec`)](#9-hạng-mục-8-9-cổng-thiết-kế-api-old-coder-api-vào-phase-1-to-spec)
10. [📋 Checklist 9 Bước Thực Thi Khi Ngồi Vào Máy Mới](#10--checklist-9-bước-thực-thi-khi-ngồi-vào-máy-mới)

---

## 1. Tóm Tắt Các Điểm Nghẽn & Hướng Khắc Phục

| STT | Điểm Nghẽn Cũ | Rủi Ro Thực Tế | Giải Pháp Đã Triển Khai |
| :--- | :--- | :--- | :--- |
| **1** | Gọi lệnh CLI trực tiếp qua `orca terminal send` thô. | Khi hủy Task hoặc Timeout, tiến trình con vẫn chạy ngầm, ngốn 100% CPU/RAM. | Xây dựng **Wrapper Relay** (`scripts/relay-exec.mjs`) có Watchdog Timeout và Process-Tree Group Kill (`process.kill(-pid, "SIGKILL")`). |
| **2** | Đọc kết quả qua việc parse log terminal không đồng nhất. | Khó xác định chính xác danh sách file bị sửa, dễ sót file rác hoặc commit nhầm. | Chuẩn hóa **Hợp đồng `run_result.json`** kết hợp trích xuất tự động qua `git status --porcelain`. |
| **3** | `worker-agy` (nghiên cứu) chạy với cờ `--dangerously-skip-permissions`. | Agent nghiên cứu có thể vô tình sửa hoặc xóa nhầm code trong lúc đọc hiểu. | Thêm cờ `--read-only` (Plan Mode) + **Tripwire** (`scripts/safe-research.sh`) tự khôi phục khi có file bị sửa. |
| **4** | Cấu hình agent bị fix cứng. | Không tận dụng được các model siêu rẻ/local (như Aider, Codex) khi làm task phụ. | Cấu hình hóa **Fleet of Lanes** qua file [`fleet.json`](../fleet.json) (`coordinator`, `fast-coder`, `deep-research`, `cheap-tests`). |
| **5** | Sửa lỗi nhỏ $\le 5$ dòng vẫn đá về cho worker và chờ 10 phút. | Lãng phí token và tài nguyên (`Photosynthesizing... 9m46s`). | Quy tắc **Fix-in-Place (Ngưỡng 5 Dòng)**: Lead tự sửa trực tiếp trong worktree. |
| **6** | Worker viết test nông cạn (chỉ test happy-path) để qua mặt gate `npm test`. | Code pass test nhưng vẫn có bug tiềm ẩn, test không bắt được lỗi logic thực tế. | Bổ sung **Võ đài Gauntlet** (`scripts/run-gauntlet.sh`): Lint & Types + Changed-Line Coverage + Mutation Testing (`Stryker`). |
| **7** | Hội đồng Review 3 Agent bị mỏ neo ngữ cảnh (Confirmation Bias). | Antigravity đọc log chat của Coder nên bị tin tưởng mù quáng. | Áp dụng **Giao thức Thẩm định Mù (Blind Verification)** chỉ với đúng 4 đầu vào khách quan (`old-coder`). |
| **8** | Thiết kế API backend bị tùy tiện, thiếu tính nhất quán. | API dễ breaking changes, rò rỉ database ID, thiếu idempotency. | Nhúng **9 Cổng Thiết Kế API (`old-coder-api`)** bắt buộc vào Phase 1 (`/to-spec`). |

---

## 2. Hạng Mục 1: Wrapper An Toàn Tiến Trình (`scripts/relay-exec.mjs`)

Mọi lệnh gọi worker nặng đều có thể bọc qua `scripts/relay-exec.mjs`:
```bash
node scripts/relay-exec.mjs claude-m3 900000 run_result.json -p "Task: /implement task #102"
```
- **Tạo Process Group riêng**: `detached: true` trên Linux/macOS.
- **Dọn sạch cây tiến trình**: `process.kill(-proc.pid, "SIGKILL")` khi hết timeout hoặc bị hủy.
- **Tự động lưu metadata**: Ghi thời gian thực thi, exit code, và preview stderr vào `run_result.json`.

---

## 3. Hạng Mục 2: Chuẩn Hóa Hợp Đồng Kết Quả (`run_result.json`)

Sau khi worker hoàn thành nhiệm vụ trong worktree `agent/task-<id>`, cấu trúc báo cáo chuẩn được định dạng như sau:

```json
{
  "version": "orca-relay.v1",
  "taskId": "task-102",
  "agent": "MiniMax-M3",
  "status": "completed",
  "exitCode": 0,
  "executionDuration": "4m12s",
  "touchedFiles": [
    "src/services/billing.ts",
    "test/services/billing.test.ts"
  ],
  "gates": {
    "npmTest": "PASS (14 passed, 0 failed)",
    "linter": "PASS",
    "coverage": "100% changed lines",
    "mutationScore": "100% (6/6 mutants killed)"
  },
  "selfReport": "Đã triển khai logic idempotency cho refund retry theo spec.md."
}
```

---

## 4. Hạng Mục 3: Cơ Chế Bẫy Vi Phạm Read-Only (`scripts/safe-research.sh`)

Khi Antigravity CLI (`agy`) thực hiện nghiên cứu kiến trúc tại Phase 1 (`/research`, `/domain-modeling`), script `scripts/safe-research.sh` sẽ:
1. Chụp SHA-256 fingerprint của Git Worktree trước khi chạy.
2. Khởi chạy `agy` ở chế độ `--mode plan`.
3. Chụp lại SHA-256 sau khi chạy. Nếu phát hiện bất kỳ file nào bị sửa đổi, kích hoạt **Tripwire** tự động dọn sạch (`git checkout . && git clean -fd`) và báo lỗi.

---

## 5. Hạng Mục 4: Mở Rộng Cấu Hình Fleet Lanes (`fleet.json`)

File cấu hình [`fleet.json`](../fleet.json) cho phép tùy chỉnh linh hoạt vai trò và model của từng làn làm việc:
- **`coordinator`**: Claude Sonnet 5 (Triage, Spec, Gatekeeper, Auto-Merge).
- **`fast-coder`**: MiniMax-M3 (Lập trình siêu tốc, TDD, syntax review).
- **`deep-research`**: Antigravity (Gemini 3.7 Flash High) (Thẩm định kiến trúc & Blind Review).
- **`cheap-tests`**: Aider / DeepSeek (Sinh mock data, fixtures).

---

## 6. Hạng Mục 5: Tinh Chỉnh State Healing & Fix-in-Place ($\le 5$ dòng)

```
IF (npm test THẤT BẠI) THEN:
  Đọc log lỗi;
  IF (Lỗi là do typo, import thiếu, sai định dạng, linter, hoặc code sửa <= 5 dòng) THEN:
    Coordinator TỰ TAY SỬA TRỰC TIẾP trong Worktree;
    Chạy lại npm test;
    NẾU Pass -> Tiến thẳng tới Phase 5 (Tripartite Review);
  ELSE:
    Bounce về Coder Worker kèm lệnh /diagnosing-bugs (Tối đa 2 lần);
  END IF;
END IF;
```

---

## 7. Hạng Mục 6: Võ Đài Thử Thách Gauntlet & Mutation Testing (`scripts/run-gauntlet.sh`)

Thay vì chỉ chạy `npm test` đơn thuần, Lead Coordinator kích hoạt `scripts/run-gauntlet.sh`:
1. **Lint & Types**: `tsc --noEmit` & `eslint`.
2. **Standard Tests**: `npm test`.
3. **Changed-Line Coverage**: 100% dòng code thay đổi phải có unit test bao phủ.
4. **Mutation Testing**: Cấy bug giả bằng Stryker để kiểm tra độ nhạy của test suite.
5. **Property-Based Testing**: Kiểm tra dữ liệu ngẫu nhiên với `fast-check`.

---

## 8. Hạng Mục 7: Giao Thức Thẩm Định Mù (Blind Adversarial Verification)

Khi kích hoạt **Antigravity CLI (Gemini 3.7 Flash High)** thẩm định tại Phase 5 (Review Gate), **tuyệt đối giấu toàn bộ log trao đổi của Coder**, chỉ nạp vào đúng 4 thông tin tối thiểu:
1. **Yêu cầu Issue gốc** (từ `gh issue view` hoặc `glab issue view`).
2. **File `spec.md` đã phê duyệt**.
3. **Commit SHA** hiện tại trong Git Worktree.
4. **Kết quả kiểm định Gauntlet** (`scripts/run-gauntlet.sh`).

Antigravity thẩm định với tâm thế **Hacker phản biện độc lập**:
- Tự kiểm tra các trường hợp biên bị bỏ sót trong `spec.md`.
- Đảm bảo không có hiện tượng gian lận test (mock rỗng, thiếu assertion).
- Trả về verdict khách quan: `PASS`, `DEFECT`, hoặc `BLOCKED`.

---

## 9. Hạng Mục 8: 9 Cổng Thiết Kế API (`old-coder-api`) vào Phase 1 (`/to-spec`)

Khi xử lý các Issue liên quan đến Backend/API, Lead Coordinator bắt buộc đối chiếu qua 9 Cổng:

- [ ] 1. **Boring:** Tên endpoint dùng danh từ số nhiều (`/orders`), status codes chuẩn (`400`, `404`, `422`, `429`).
- [ ] 2. **Don't break userspace:** Chỉ thêm trường mới tùy chọn, không đổi tên hoặc xóa trường cũ.
- [ ] 3. **Simple Authentication:** API Key có scoped rõ ràng cho server-to-server; OAuth cho client.
- [ ] 4. **Server-side Authorization:** Luôn kiểm tra quyền ở cấp server, không tin tưởng `tenant_id` từ client.
- [ ] 5. **Idempotency Keys:** Bắt buộc có Idempotency Key cho các tác vụ thanh toán hoặc có side-effect lớn.
- [ ] 6. **Rate Limiting & Blast Radius:** Mọi endpoint đều có rate limit, trả về header `Retry-After`.
- [ ] 7. **Cursor-based Pagination:** Dùng con trỏ `WHERE id > :cursor LIMIT :n` cho danh sách lớn, cấm dùng `OFFSET`.
- [ ] 8. **Expensive fields are optional:** Các trường tính toán đắt đỏ phải để sau `?include=...` và mặc định tắt.
- [ ] 9. **No implementation leakage:** Không để lộ enum, ID bảng nội bộ hay cấu trúc database ra API JSON.

---

## 10. Hạng Mục 9: Bao Con Nhộng An Toàn Worker (`Worker Safety Capsule`)
*(Tham chiếu kỹ thuật từ `tinkerer0/orca-autonomous-coordinator`)*

Khi điều phối task cho bất kỳ subagent nào tại **Phase 3**, bắt buộc phải inject mẫu hợp đồng an toàn:

```text
=== 🛡️ WORKER SAFETY CAPSULE ===
ROLE: Finite implementation worker (CẤM biến thành coordinator, Depth <= 3).
OBJECTIVE: Triển khai task #<id> đúng spec.md và CONTEXT.md bằng /tdd.
EXCLUSIONS: CẤM đụng vào file cấu hình gốc, CẤM sửa file ngoài module được phân công.
AUTHORITY:
  - Exact Read Paths: [spec.md, CONTEXT.md, thư mục source và test liên quan]
  - Exact Write Paths: [danh sách file cần sửa]
  - External Side Effects: NONE (cấm gọi mạng ngoài, cấm deploy)
SAFETY BOUNDARY:
  - Cấm vượt gate kiểm thử, cấm làm lộ bí mật API.
  - Tự động xuất run_result.json sau khi hoàn tất.
================================
```

---

## 11. Hạng Mục 10: Thang Phản Ứng Sự Cố 7 Nấc (`Bounded Failure Ladder`)
*(Tham chiếu kỹ thuật từ `tinkerer0/orca-autonomous-coordinator`)*

Phân loại chính xác nguyên nhân lỗi trước khi hành động, tránh vòng lặp retry vô tận:

| Loại Lỗi | Hành Động Tự Hành Chuẩn | Hạn Mức (Budget) |
| :--- | :--- | :--- |
| **Lỗi mạng / Runtime tạm thời** | Thử lại đúng cấu hình cũ. | Tối đa **1 lần**. |
| **Hết Quota / API lỗi / Thiếu tool** | **KHÔNG retry vô ích**; Chuyển ngay (Failover) sang làn khác trong `fleet.json` (VD: MiniMax $\rightarrow$ Claude). | Tối đa **1 lần đổi**. |
| **Worker bị đơ (Stall / Treo terminal)** | Gửi 1 prompt ping liveness; nếu vẫn đơ thì `relay-exec` kill (`process.kill(-pid, "SIGKILL")`) và giao lại. | Tối đa **1 lần cứu hộ**. |
| **Xung đột Interface / Shared State** | Dừng ngay lập tức các worker song song và chuyển sang làm tuần tự (**Serialize**). | Chuyển ngay tuần tự. |
| **Lệch format kết quả** | Yêu cầu định dạng lại file `run_result.json` mà không bắt code lại phần đã pass. | Tối đa **1 lần**. |
| **Lỗi kiểm thử / Unit test fail** | Lead tự sửa tại chỗ ($\le 5$ dòng) hoặc đá về Coder kèm log chi tiết. | Tối đa **2 lần bounce**. |
| **Vi phạm Gate an toàn** | Dừng luồng bị ảnh hưởng ngay lập tức; cấm đi đường vòng. | Hard stop & báo cáo. |

---

## 12. 📋 Checklist 9 Bước Thực Thi Khi Ngồi Vào Máy Mới

- [ ] **Bước 1: Pull mã nguồn mới nhất**:
  ```bash
  git pull origin main
  ```
- [ ] **Bước 2: Chạy script cấu hình 1-click**:
  ```bash
  ./scripts/setup-agent-profiles.sh
  ```
- [ ] **Bước 3: Kiểm tra các script tiện ích**:
  ```bash
  ls -la scripts/relay-exec.mjs scripts/safe-research.sh scripts/run-gauntlet.sh
  ```
- [ ] **Bước 4: Kiểm tra kết nối 3 Agent CLI trên máy**:
  ```bash
  claude --version    # Kiểm tra Claude Official (Sonnet 5)
  claude-m3 --version # Kiểm tra MiniMax Gateway
  agy --version       # Kiểm tra Antigravity CLI (Gemini 3.7)
  ```
- [ ] **Bước 5: Kiểm tra kết nối Git CLI**:
  ```bash
  gh auth status || glab auth status
  ```
- [ ] **Bước 6: Kích hoạt `/orca-orchestration` để xử lý Issue**:
  ```bash
  # Tự động Triage -> Viết Spec (đối chiếu 9 API Gates) -> Mở Worktree -> TDD -> Gauntlet -> Blind Review -> Auto-Merge MR!
  ```
- [ ] **Bước 7: Theo dõi tiến độ trực tiếp trên Orca ADE Workspace Board**.
- [ ] **Bước 8: Kiểm tra kết quả MR/PR đã tự động merge sau khi 3.7 và Claude duyệt**.
- [ ] **Bước 9: Tận hưởng quy trình làm việc tự hành 100%!**
