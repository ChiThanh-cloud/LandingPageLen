# AGENTS.md — Tiệm Len Nhà Tiny

## BẮT BUỘC ĐỌC TRƯỚC KHI LÀM VIỆC

Trước khi phân tích, chỉnh sửa hoặc tạo code trong repository này, AI/Agent phải đọc:

1. `TINY_ECOMMERCE_AI_WORKFLOW.md`
2. `TINY_CODING_RULES.md`
3. Yêu cầu mới nhất của chủ shop trong cuộc hội thoại hiện tại.

Hai file trên là project specification và coding policy của dự án.

Nếu yêu cầu mới nhất của chủ shop mâu thuẫn với tài liệu cũ, yêu cầu mới nhất được ưu tiên.
Nếu có điểm chưa rõ và việc đoán có thể ảnh hưởng architecture, database, security, payment hoặc protected scope, phải hỏi lại trước khi code.

---

## PHẠM VI CHÍNH

Chỉ khu vực:

`/len-soi`

được phát triển thành ecommerce trong giai đoạn hiện tại.

Các khu vực sau là **PROTECTED SCOPE**:

- Đồ móc đặt riêng
- Hộp quà
- Set tự móc

Không được tự ý chỉnh sửa giao diện, business logic, route hoặc chuyển các phần này thành ecommerce nếu chưa có sự cho phép rõ ràng của chủ shop.

Có thể đề xuất cải tiến, nhưng không được tự implement.

---

## STACK ĐÃ CHỐT

- Framework: Next.js
- Hosting: Vercel
- Database: Supabase
- Image storage: Cloudinary
- Checkout: Guest checkout
- Customer account: Không dùng trong MVP
- Cart: Chỉ áp dụng cho `/len-soi`

Không tự đổi stack hoặc bổ sung backend framework riêng nếu chưa có lý do và chưa được duyệt.

---

## WORKFLOW BẮT BUỘC

Trước khi code:

1. Đọc specification.
2. Audit code hiện tại.
3. Xác định đúng scope.
4. Liệt kê ngắn các file dự kiến sửa/tạo.
5. Kiểm tra ảnh hưởng tới shared/global code.
6. Nếu vượt protected scope: DỪNG và xin phép.
7. Sau đó mới implement.

Sau khi code:

- Chạy typecheck.
- Chạy lint.
- Chạy test nếu có.
- Chạy build.
- Báo file đã thay đổi.
- Báo lỗi/rủi ro còn lại.

Không tuyên bố hoàn tất nếu build/test còn lỗi.

---

## NGUYÊN TẮC QUAN TRỌNG

- Không rewrite toàn project nếu chỉ cần sửa cục bộ.
- Không sửa global CSS nếu component/page-level styling giải quyết được.
- Không fake dữ liệu production.
- Không hard-code secret.
- Không tin price/stock/total/payment status từ frontend.
- Không tự sửa schema Supabase nếu chưa audit schema hiện có.
- Không tự thêm dependency nếu dependency hiện tại/native API đã giải quyết được.
- Không làm mất SEO hiện tại.
- Không sửa protected scope vì lý do “đồng bộ ecommerce”.

Chi tiết đầy đủ nằm trong:
`TINY_ECOMMERCE_AI_WORKFLOW.md`
và
`TINY_CODING_RULES.md`.
