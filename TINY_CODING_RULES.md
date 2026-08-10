# TINY CODING RULES

> Coding policy dành cho AI/Agent làm việc trên repository Tiệm Len Nhà Tiny.

## 1. Không code trước khi audit

Trước mỗi task, phải kiểm tra file/component/data layer liên quan.
Không tạo kiến trúc song song nếu repository đã có solution tương đương.

## 2. Thay đổi tối thiểu

Ưu tiên:
- reuse component;
- reuse type;
- reuse design token;
- sửa cục bộ;
- giữ backward compatibility nếu hợp lý.

Tránh:
- rewrite toàn page không cần thiết;
- đổi folder structure diện rộng;
- rename hàng loạt;
- đổi stack chỉ vì preference cá nhân.

## 3. Protected scope

Không chỉnh sửa các phần:
- Đồ móc đặt riêng
- Hộp quà
- Set tự móc

trừ khi chủ shop yêu cầu trực tiếp.

Nếu shared component cần sửa và có khả năng ảnh hưởng protected scope:
- mô tả thay đổi;
- nêu ảnh hưởng;
- xin phép trước.

## 4. CSS/UI

- Không chỉnh global CSS chỉ để fix một trang nếu có thể dùng scoped/component CSS.
- Không đổi branding Tiny.
- Không copy nguyên visual của website tham khảo.
- Ảnh tham khảo chỉ dùng để hiểu layout/UX trừ khi chủ shop nói khác.
- Responsive desktop/mobile là bắt buộc cho UI ecommerce.

## 5. Data

Nguồn production:
- Supabase: dữ liệu
- Cloudinary: ảnh

Không dùng local mock làm production source nếu dữ liệu thật đã có.

Không fake:
- price;
- stock;
- review;
- rating;
- promotion;
- sales count;
- shipping ETA;
- product image.

Nếu dữ liệu thiếu:
- báo thiếu;
- hoặc dùng placeholder development được đánh dấu rõ.

## 6. Supabase

Trước khi sửa schema:
- audit schema hiện tại;
- kiểm tra table/column/type;
- kiểm tra RLS/policies liên quan.

Không tự drop/rename table hoặc column production.

Client/public code chỉ được sử dụng public/publishable credentials.
Secret/service credentials chỉ server-side.

## 7. Security

Không hard-code secret.

Không expose bằng `NEXT_PUBLIC_`:
- service role;
- Cloudinary API secret;
- payment secret;
- webhook secret.

Các thao tác nhạy cảm phải đi server-side:
- tạo order;
- tính giá cuối;
- cập nhật stock;
- payment;
- order lookup có PII.

Backend phải re-query trusted data trước khi tính tiền.

## 8. API validation

Mọi API write phải validate input.

Ưu tiên schema validation hiện có; nếu repository có Zod thì reuse Zod.

Không trust:
- price;
- subtotal;
- total;
- stock;
- paid;
- order status;
- payment status

từ browser.

## 9. Cart

Cart chỉ áp dụng cho `/len-soi`.

Cart item định danh bằng:
- productId;
- variantId;
- quantity.

UI có thể cache name/image/price để render nhanh, nhưng backend không dùng cache client làm source of truth.

## 10. SEO

Không phá:
- metadata hiện tại;
- canonical;
- sitemap;
- structured data hợp lệ;
- blog SEO.

Product/category mới phải có crawlable URL thật.

Không dùng modal làm URL duy nhất cho product.

Không fake structured data.

## 11. Dependency policy

Trước khi `npm install`:
1. kiểm tra package hiện có;
2. kiểm tra native Next.js/Web API có đủ không;
3. giải thích dependency mới dùng để làm gì.

Không thêm package chỉ để giải quyết vài dòng code đơn giản.

## 12. Environment variables

Không commit `.env`, `.env.local`, production secrets.

`.env.example` chỉ chứa:
- tên biến;
- giá trị trống hoặc dummy an toàn.

Khi thêm env mới, cập nhật `.env.example`.

## 13. Database migrations

Nếu cần migration:
- tạo migration riêng;
- không chỉnh lịch sử migration đã chạy;
- migration phải có phạm vi rõ;
- không xóa dữ liệu production trừ khi có yêu cầu cụ thể.

## 14. Error handling

Không swallow error im lặng trong production logic.

Không hiển thị raw stack trace/secret/database error cho khách.

UI trả message thân thiện.
Server log đủ để debug nhưng không log secret và hạn chế PII.

## 15. Order lookup

Không cho tra cứu toàn bộ đơn chỉ bằng phone/email.

Ưu tiên:
- orderCode + phone
hoặc
- orderCode + email.

Chống enumeration và mask PII khi hiển thị.

## 16. Payment

Không tích hợp provider khi chủ shop chưa chọn.

Khi có payment:
- verify signature;
- verify amount;
- verify order;
- idempotent webhook;
- success redirect không phải bằng chứng thanh toán.

## 17. Testing trước khi kết thúc

Tùy scripts hiện có, chạy:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Nếu script không tồn tại, báo rõ thay vì giả vờ đã chạy.

Với UI:
- kiểm tra desktop;
- kiểm tra mobile;
- kiểm tra route mới;
- kiểm tra protected sections không bị vỡ.

## 18. Báo cáo sau task

Trả về ngắn gọn:
- Đã thay đổi gì.
- File đã sửa/tạo.
- Schema/API có thay đổi không.
- Dependency mới.
- Test/build đã chạy.
- Việc còn lại/rủi ro.

## 19. Khi không chắc

Nếu quyết định liên quan:
- business rule;
- giá;
- shipping;
- payment;
- schema production;
- protected scope;
- xóa dữ liệu;
- đổi architecture;

thì không đoán.

Hỏi chủ shop trước.
