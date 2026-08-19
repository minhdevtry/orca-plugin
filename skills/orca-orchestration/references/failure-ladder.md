# 🪜 Thang Phản Ứng Sự Cố 7 Nấc (`Bounded Failure Ladder`)

Phân loại chính xác nguyên nhân lỗi trước khi hành động, tránh vòng lặp retry vô tận.

---

## Bảng Phản Ứng Sự Cố & Hạn Mức Thực Thi

| Nấc | Loại Lỗi | Dấu Hiệu Nhận Biết | Hành Động Tự Hành Chuẩn | Hạn Mức (Budget) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Lỗi mạng / Runtime tạm thời** | ECONNRESET, 502 Bad Gateway, Socket hangup | Thử lại đúng cấu hình cũ. | Tối đa **1 lần**. |
| **2** | **Hết Quota / API lỗi / Thiếu tool** | 429 Quota Exceeded, Model not available, Missing tool | **KHÔNG retry vô ích**; Chuyển ngay (Failover) sang làn khác trong `fleet.json` (VD: MiniMax $\rightarrow$ Claude). | Tối đa **1 lần đổi**. |
| **3** | **Worker bị đơ (Stall / Treo)** | Quá timeout mặc định, không có stdout mới | Gửi 1 prompt ping liveness; nếu vẫn đơ thì `relay-exec` kill (`process.kill(-pid, "SIGKILL")`) và giao lại. | Tối đa **1 lần cứu hộ**. |
| **4** | **Xung đột Interface / Shared State** | Merge conflict, file lock, type mismatch giữa 2 worker | Dừng ngay lập tức các worker song song và chuyển sang làm tuần tự (**Serialize**). | Chuyển ngay tuần tự. |
| **5** | **Lỗi định dạng kết quả** | `run_result.json` rỗng hoặc sai schema | Yêu cầu ghi lại `run_result.json` mà không bắt code lại phần đã pass. | Tối đa **1 lần**. |
| **6** | **Lỗi kiểm thử / Unit test fail** | `npm test` fail trong worktree | Lead tự sửa tại chỗ ($\le 5$ dòng) hoặc đá về Coder kèm log chi tiết. | Tối đa **2 lần bounce**. |
| **7** | **Vi phạm Gate an toàn** | Sửa file cấm trong `fleet.json`, xóa test cũ, lộ secret | Dừng luồng bị ảnh hưởng ngay lập tức; cấm đi đường vòng; chuyển sang `needs-info` báo cáo con người. | Hard stop & Escalate. |
