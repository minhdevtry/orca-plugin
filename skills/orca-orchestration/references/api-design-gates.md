# 🛡️ 9 Cổng Thiết Kế API Backend (`old-coder-api`)

Tài liệu tham chiếu chuẩn cho Phase 1 (`/to-spec`) khi xử lý các Issue liên quan đến Backend/API trong Orca ADE.

---

## Danh Sách 9 Cổng Kiểm Định

- [ ] **1. Boring (Đơn giản, chuẩn mực):**
  - Tên endpoint dùng danh từ số nhiều (`/orders`, `/customers`).
  - Dùng HTTP status codes chuẩn (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `429 Too Many Requests`).

- [ ] **2. Don't break userspace (Không phá vỡ tương thích ngược):**
  - Chỉ thêm trường mới tùy chọn (optional fields).
  - Tuyệt đối không đổi tên, không xóa trường cũ đã công khai.
  - Sử dụng deprecation headers thay vì xóa đột ngột.

- [ ] **3. Simple Authentication (Xác thực đơn giản):**
  - API Key có scoped quyền rõ ràng cho server-to-server (`Bearer <token>`).
  - OAuth 2.0 / OIDC cho ứng dụng client người dùng.

- [ ] **4. Server-side Authorization (Phân quyền tại máy chủ):**
  - Luôn kiểm tra quyền ở cấp server trong mọi handler.
  - Không tin tưởng `tenant_id`, `role`, hay `user_id` từ client payload/header.

- [ ] **5. Idempotency Keys (Khóa bất biến):**
  - Bắt buộc hỗ trợ Header `Idempotency-Key` cho các tác vụ thanh toán, hoàn tiền hoặc mutation có tác dụng phụ lớn.

- [ ] **6. Rate Limiting & Blast Radius (Giới hạn tốc độ & Bán kính ảnh hưởng):**
  - Mọi endpoint đều có rate limit theo IP hoặc User ID.
  - Trả về header `Retry-After` khi bị `429 Too Many Requests`.

- [ ] **7. Cursor-based Pagination (Phân trang con trỏ):**
  - Dùng con trỏ `WHERE id > :cursor LIMIT :n` cho danh sách lớn hoặc realtime streams.
  - Cấm dùng `OFFSET` cho các bảng lớn (tránh quét full table scan).

- [ ] **8. Expensive fields are optional (Trường đắt đỏ là tùy chọn):**
  - Các trường tính toán nặng, quan hệ join nhiều bảng phải nằm sau query param `?include=...` và mặc định tắt.

- [ ] **9. No implementation leakage (Không rò rỉ chi tiết nội bộ):**
  - Không để lộ database column names, database primary keys dạng số tự tăng (dùng UUID/ULID/Slug).
  - Không để lộ stacktrace trong response lỗi môi trường production.
