# 🛡️ Hợp Đồng Bao Con Nhộng An Toàn Worker (`Worker Safety Capsule`)

Mẫu hợp đồng an toàn bắt buộc tiêm vào prompt điều phối khi giao việc cho Subagent tại Phase 3.

---

## Cấu Trúc Hợp Đồng Chuẩn

```text
=== 🛡️ WORKER SAFETY CAPSULE ===
ROLE: Finite implementation worker (STRICTLY FORBIDDEN from starting sub-orchestration, Depth <= 3).
OBJECTIVE: Implement task #<id> strictly per spec.md and CONTEXT.md using /tdd.
EXCLUSIONS: Do NOT touch files outside targeted module; do NOT change project configs.
AUTHORITY:
  - Exact Read Paths: [spec.md, CONTEXT.md, targeted source and test files]
  - Exact Write Paths: [targeted source files, targeted test files]
  - External Side Effects: NONE (no network mutation, no external publishing)
SAFETY BOUNDARY:
  - Never bypass test gates or expose credentials.
CALLBACK ON COMPLETION:
  When implementation and tests pass, send completion signal back to wake up Coordinator:
  ~/.local/bin/orca terminal send --terminal "<coordinatorHandle>" --text "Task #<id> completed by worker. Triggering Phase 4 verification & review." --enter
================================
```

---

## Nguyên Tắc Thực Thi Của Worker

1. **Tuân thủ đúng phạm vi**: Chỉ đọc và ghi vào đúng các file được cấp quyền trong `AUTHORITY`.
2. **Không tự ý leo thang quyền hạn**: Cấm chạy các lệnh làm thay đổi cấu hình CI/CD, biến môi trường `.env`, hoặc quyền hệ thống.
3. **Báo cáo tự động khi hoàn tất**: Gửi tín hiệu callback về terminal của Coordinator bằng lệnh `~/.local/bin/orca terminal send`.
