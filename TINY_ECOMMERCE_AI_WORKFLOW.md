# TINY ECOMMERCE AI WORKFLOW

> Tài liệu này là nguồn yêu cầu chính cho mọi AI/Agent khi chỉnh sửa phần ecommerce của **Tiệm Len Nhà Tiny**.
>
> Trước khi sửa code, AI phải đọc toàn bộ file này, đối chiếu với repository hiện tại, sau đó chỉ thực hiện trong phạm vi được cho phép.
>
> Nếu yêu cầu mới của chủ shop mâu thuẫn với tài liệu này, **yêu cầu mới nhất của chủ shop được ưu tiên**.

---

## 1. Mục tiêu dự án

Website Tiệm Len Nhà Tiny hiện có 4 nhóm nội dung/sản phẩm lớn:

1. **Len sợi & phụ kiện**
2. **Đồ móc đặt riêng**
3. **Hộp quà**
4. **Set tự móc**

Trong giai đoạn hiện tại:

- **Chỉ nhóm "Len sợi & phụ kiện" được chuyển thành ecommerce.**
- 3 nhóm còn lại giữ nguyên cấu trúc, giao diện và luồng hiện tại.
- Không được tự ý biến toàn bộ website thành ecommerce.
- Không được tự ý thêm giỏ hàng, checkout hoặc logic mua hàng vào 3 nhóm còn lại.

---

## 2. Phạm vi được phép thay đổi

### 2.1. Khu vực ecommerce được phép phát triển

Phạm vi chính:

```text
/len-soi
```

Bao gồm:

- Trang danh mục len sợi & phụ kiện.
- Danh mục con.
- Danh sách sản phẩm.
- Trang chi tiết sản phẩm.
- Product variant.
- Chọn màu / loại / phiên bản.
- Số lượng.
- Tồn kho.
- Giỏ hàng.
- Checkout.
- Tạo đơn hàng.
- Thanh toán.
- Trang đặt hàng thành công.
- Tra cứu đơn hàng.
- Logic backend liên quan trực tiếp đến ecommerce.
- SEO cho category/product ecommerce.

### 2.2. Khu vực bị bảo vệ

Các khu vực sau **KHÔNG ĐƯỢC sửa khi chưa có sự cho phép rõ ràng của chủ shop**:

```text
Đồ móc đặt riêng
Hộp quà
Set tự móc
```

Ngoài ra không được tự ý thay đổi:

- Homepage nếu thay đổi đó không cần thiết cho `/len-soi`.
- Blog.
- Nội dung bài viết.
- Form đặt đồ móc hiện tại.
- Branding.
- Header/footer chung nếu không thật sự cần thiết.
- Global CSS nếu có thể giải quyết bằng component/page-level CSS.
- Cấu trúc SEO của các phần không thuộc ecommerce.
- Database schema ngoài phạm vi ecommerce.
- Dữ liệu production hiện có.

Nếu một thay đổi ecommerce bắt buộc phải sửa shared component/global style và có nguy cơ ảnh hưởng các khu vực trên, AI phải:

1. Giải thích lý do.
2. Liệt kê file cần sửa.
3. Nêu ảnh hưởng dự kiến.
4. Xin phép trước khi thực hiện.

---

## 3. Business model của `/len-soi`

`/len-soi` là khu vực bán hàng trực tiếp.

Người dùng vào khu vực này để:

1. Chọn **Len** hoặc **Phụ kiện**.
2. Xem danh sách sản phẩm.
3. Lọc/sắp xếp sản phẩm.
4. Mở trang chi tiết.
5. Chọn variant nếu sản phẩm có nhiều màu/loại.
6. Chọn số lượng.
7. Thêm vào giỏ hàng hoặc mua ngay.
8. Checkout.
9. Nhập thông tin giao hàng.
10. Chọn phương thức thanh toán.
11. Đặt hàng.
12. Nhận mã đơn hàng.
13. Có thể tra cứu trạng thái đơn sau đó.

---

## 4. Cấu trúc danh mục

Nhóm cha:

```text
Len sợi & phụ kiện
```

Có ít nhất 2 nhóm con:

```text
Len
Phụ kiện
```

Có thể mở rộng thêm category trong tương lai, ví dụ:

```text
Milk Cotton
Len Nhung
Len Cotton
Len Baby
Kim móc
Mắt thú
Phụ kiện nhồi bông
...
```

Nhưng không hard-code UI theo kiểu chỉ hỗ trợ đúng vài category cố định.

Category nên được lấy từ data layer/database nếu database đã có cấu trúc phù hợp.

### Gợi ý URL

```text
/len-soi
/len-soi/danh-muc/len
/len-soi/danh-muc/phu-kien
/len-soi/[product-slug]
```

Không tạo URL riêng cho từng màu của cùng một sản phẩm.

Ví dụ đúng:

```text
/len-soi/milk-cotton-50g
```

Bên trong URL đó có các variant:

```text
01 - Trắng
02 - Kem
03 - Hồng
...
```

---

## 5. Trang `/len-soi`

Trang category phải mang tính ecommerce, không phải editorial showcase.

### Desktop

Ưu tiên layout:

```text
Sidebar bên trái
+
Product grid bên phải
```

Sidebar có thể gồm:

- Danh mục.
- Khoảng giá.
- Filter phù hợp với dữ liệu thực.

Product area có:

- Tiêu đề.
- Tổng số sản phẩm nếu có.
- Sort.
- Product grid đồng đều.

Ví dụ sort:

```text
Mới nhất
Tên A-Z
Tên Z-A
Giá thấp → cao
Giá cao → thấp
```

Product card phải nhỏ gọn, đồng đều và dễ scan.

Mỗi card có thể gồm:

- Ảnh.
- Tên sản phẩm.
- Giá.
- Trọng lượng/đơn vị nếu có.
- Số màu hoặc thông tin ngắn.
- CTA "Xem sản phẩm".

Mỗi sản phẩm phải dẫn tới URL thật bằng `Link`.

---

## 6. Trang chi tiết sản phẩm

Route chính:

```text
/len-soi/[slug]
```

Product detail cần hỗ trợ:

### Gallery

- Ảnh chính.
- Thumbnail.
- Click thumbnail đổi ảnh chính.
- Sử dụng ảnh thật từ data source.

### Product information

- Tên.
- Brand nếu có.
- Category.
- Giá.
- Trọng lượng.
- Mô tả.
- Thông số kỹ thuật.
- Tồn kho.

### Variants

Ví dụ:

- Màu.
- Mã màu.
- Size.
- Loại.

Variant selector phải:

- Có selected state.
- Cập nhật variant ID.
- Cập nhật stock.
- Cập nhật ảnh chính nếu variant có ảnh.
- Không cho chọn variant hết hàng để mua.

### Quantity

```text
[-] 1 [+]
```

Không cho:

```text
quantity < 1
quantity > available stock
```

### CTA

```text
[ Thêm vào giỏ hàng ]
[ Mua ngay ]
```

---

## 7. Quy tắc về giỏ hàng

**Giỏ hàng chỉ tồn tại trong phạm vi ecommerce `/len-soi`.**

Không thêm cart logic vào:

- Đồ móc đặt riêng.
- Hộp quà.
- Set tự móc.

Cart item phải lưu bằng ID thực:

```text
productId
variantId
quantity
```

Có thể lưu thêm thông tin UI/cache, nhưng backend không được tin các giá trị nhạy cảm từ client như:

```text
price
subtotal
total
stock
paymentStatus
```

Giá cuối cùng phải được backend lấy lại từ database.

### Cart cần hỗ trợ

- Thêm sản phẩm.
- Xóa sản phẩm.
- Tăng/giảm số lượng.
- Variant cụ thể.
- Hiển thị subtotal.
- Đi tới checkout.

### Guest cart

Không yêu cầu khách tạo tài khoản.

Có thể dùng client state/local persistence cho cart vì cart không chứa dữ liệu nhạy cảm.

---

## 8. Mua ngay

Nút `Mua ngay`:

- Không bắt buộc thêm item vào cart lâu dài.
- Có thể chuyển trực tiếp tới checkout với:
  - productId
  - variantId
  - quantity

Backend vẫn phải kiểm tra lại sản phẩm, giá và stock.

---

## 9. Checkout

Website sử dụng **Guest Checkout**.

Không yêu cầu:

- Login.
- Register.
- Account khách hàng.

### 9.1. Thông tin người nhận

Bắt buộc:

```text
Họ và tên
Số điện thoại
```

Khuyến nghị:

```text
Email
```

Email có thể dùng để:

- Gửi xác nhận đơn.
- Gửi mã đơn.
- Hỗ trợ tra cứu đơn.

Nếu muốn giảm friction, email có thể optional trong phiên bản đầu.

### 9.2. Địa chỉ giao hàng

Nên gồm:

```text
Tỉnh / Thành phố
Quận / Huyện
Phường / Xã
Số nhà / tên đường / địa chỉ chi tiết
```

Optional:

```text
Ghi chú giao hàng
```

### 9.3. Thông tin giao hàng

Checkout cần hiển thị:

- Phương thức giao hàng.
- Phí vận chuyển.
- Thời gian giao dự kiến nếu có dữ liệu thật.

Không fake freeship hoặc ETA.

Nếu chưa tích hợp shipping API:

- Cho phép cấu hình phí ship theo rule hiện có.
- Hoặc ghi rõ shop sẽ xác nhận phí vận chuyển sau nếu đó là business rule đã được chủ shop duyệt.

---

## 10. Thanh toán

Thiết kế data model để hỗ trợ nhiều phương thức.

Phiên bản đầu có thể gồm:

```text
COD
Chuyển khoản ngân hàng / QR
```

Tương lai có thể thêm:

```text
payOS
VNPAY
MoMo
hoặc payment gateway khác
```

**Không tự tích hợp payment provider khi chủ shop chưa chọn.**

Order status và payment status phải là 2 trường riêng.

Ví dụ:

```text
order_status:
pending
confirmed
packing
shipping
completed
cancelled
```

```text
payment_status:
unpaid
pending
paid
failed
refunded
```

Không dùng một trường duy nhất cho cả hai.

---

## 11. Order Summary trong checkout

Phải hiển thị rõ:

```text
Sản phẩm
Variant/màu
Số lượng
Đơn giá
Tạm tính
Phí vận chuyển
Giảm giá nếu có
Tổng thanh toán
Phương thức thanh toán
```

Backend phải tính lại:

```text
unit price
subtotal
shipping fee
discount
total
```

Không tin `total` từ browser.

---

## 12. Tạo đơn hàng

Sau khi khách submit checkout:

```text
Browser
↓
Next.js backend/API
↓
Validate request
↓
Query lại product/variant từ database
↓
Kiểm tra stock
↓
Tính lại giá
↓
Tạo order
↓
Tạo order_items
↓
Xử lý payment nếu có
↓
Trả về orderCode
```

Không để frontend insert order trực tiếp nếu logic nghiệp vụ đang phụ thuộc vào:

- Giá.
- Stock.
- Payment.
- Shipping.
- Order status.

---

## 13. Mã đơn hàng

Sau checkout thành công phải tạo mã đơn.

Ví dụ format:

```text
TINY-XXXXXXXX
```

Không dùng ID database tuần tự như:

```text
1
2
3
4
```

làm mã tra cứu public.

Order code nên khó đoán để giảm nguy cơ enumeration.

---

## 14. Trang đặt hàng thành công

Sau khi đặt hàng thành công:

```text
/dat-hang-thanh-cong/[orderCode]
```

Hiển thị:

- Thông báo thành công.
- Mã đơn.
- Tóm tắt đơn.
- Payment status.
- Hướng dẫn tiếp theo.
- Link tra cứu đơn.

Không expose thông tin nhạy cảm không cần thiết qua URL.

---

## 15. Tra cứu đơn hàng

Không cần tài khoản khách hàng.

Route gợi ý:

```text
/tra-cuu-don-hang
```

Khách không được tra cứu chỉ bằng SĐT.

Yêu cầu ít nhất:

```text
orderCode + phone
```

hoặc:

```text
orderCode + email
```

Backend mới trả thông tin đơn khi cả hai khớp.

Kết quả public nên mask một phần:

```text
SĐT
Email
Địa chỉ
```

Ví dụ:

```text
090***123
abc***@gmail.com
```

---

## 16. Vận chuyển

Order nên hỗ trợ:

```text
shipping_provider
tracking_number
shipping_status
```

Mã đơn Tiny và mã vận đơn là hai thứ khác nhau.

```text
orderCode
= mã nội bộ của Tiny

tracking_number
= mã từ đơn vị vận chuyển
```

Khách có thể xem tracking number khi shop đã tạo vận đơn.

---

## 17. Data source hiện tại

Kiến trúc mục tiêu:

```text
Next.js
↓
Supabase = database
↓
Cloudinary = image storage
```

Supabase dùng cho dữ liệu như:

- Product.
- Category.
- Variant.
- Price.
- Stock.
- Order.
- Order item.
- Payment.
- Shipping data.

Cloudinary dùng cho:

- Product images.
- Variant images.
- Gallery images.

Supabase có thể lưu:

```text
Cloudinary URL
hoặc
Cloudinary public_id
```

Không sử dụng local image làm production source nếu sản phẩm đã có ảnh thật trên Cloudinary.

---

## 18. Gợi ý data model

AI phải audit database/schema hiện tại trước.

Không được tự ý phá schema để ép theo cấu trúc dưới đây.

Đây chỉ là kiến trúc tham khảo:

### categories

```text
id
name
slug
parent_id
status
```

### products

```text
id
category_id
slug
name
short_description
description
brand
base_price
status
created_at
updated_at
```

### product_variants

```text
id
product_id
sku
variant_name
color_code
color_name
image_url
price_override
stock
status
```

### product_images

```text
id
product_id
variant_id nullable
image_url
alt_text
sort_order
```

### orders

```text
id
order_code
customer_name
phone
email
province
district
ward
address_line
shipping_note
order_status
payment_status
shipping_provider
tracking_number
subtotal
shipping_fee
discount
total
created_at
updated_at
```

### order_items

```text
id
order_id
product_id
variant_id
product_name_snapshot
variant_name_snapshot
unit_price
quantity
line_total
```

### payments

```text
id
order_id
provider
transaction_id
amount
status
paid_at
created_at
```

Không xóa dữ liệu hiện có để tạo schema mới.

---

## 19. Backend architecture

Ưu tiên dùng backend của Next.js trong cùng repository.

Ví dụ:

```text
app/api/orders/route.ts
app/api/orders/lookup/route.ts
app/api/checkout/route.ts
app/api/payment/.../route.ts
```

Không cần dựng backend Express/Nest riêng nếu không có yêu cầu mới.

---

## 20. Security requirements

Security là yêu cầu bắt buộc, không phải optional.

### Secrets

Không hard-code:

```text
Supabase secret/service key
Cloudinary API secret
Payment secret
Webhook secret
```

Không expose secret bằng prefix:

```text
NEXT_PUBLIC_
```

`NEXT_PUBLIC_` chỉ dành cho giá trị thực sự được phép public.

`.env` không commit lên Git.

### Supabase / Database

Nếu browser đọc public product data:

- Chỉ public SELECT các bảng cần public.
- Bật RLS phù hợp.

Các bảng nhạy cảm:

```text
orders
order_items
payments
customer data
```

không được public read/write tùy tiện.

### API input validation

Mọi API write phải validate input.

Project có thể dùng Zod nếu phù hợp.

Validate ít nhất:

- productId.
- variantId.
- quantity.
- phone.
- email.
- address.
- orderCode.
- payment payload.

### Price tampering

Frontend có thể gửi:

```text
productId
variantId
quantity
```

Nhưng backend phải tự lấy:

```text
price
stock
promotion
shipping rule
```

từ trusted data source.

Không tin:

```text
price
total
paid
stock
```

do client gửi.

### Payment webhook

Khi có payment gateway:

- Verify signature.
- Verify order code.
- Verify amount.
- Xử lý idempotency.
- Không đánh dấu paid chỉ vì user quay về success URL.

### Rate limiting

Các endpoint nên cân nhắc rate limit:

```text
checkout
create order
order lookup
payment-related endpoints
```

Đặc biệt `/api/orders/lookup` cần chống brute-force/enumeration.

---

## 21. SEO requirements cho ecommerce

SEO chỉ áp dụng mạnh cho các page ecommerce được tạo mới.

### Category

```text
/len-soi
/len-soi/danh-muc/...
```

Có:

- title riêng.
- description.
- canonical.
- semantic heading.
- crawlable links.

### Product

```text
/len-soi/[slug]
```

Có:

- unique title.
- unique description.
- canonical.
- H1 duy nhất.
- OpenGraph.
- Product JSON-LD khi dữ liệu thật đủ.
- BreadcrumbList.
- Internal links.

Không fake:

- rating.
- review count.
- stock.
- discount.
- sales count.

Không tạo một URL khác cho từng màu nếu đó chỉ là variant của cùng product.

---

## 22. UX rules

Ưu tiên:

- Dễ hiểu.
- Dễ mua.
- Ít bước.
- Mobile friendly.
- Không bắt đăng ký tài khoản.
- Không giấu giá nếu đã có giá thật.
- Không hiển thị dữ liệu giả để làm đẹp giao diện.

Luồng chuẩn:

```text
Browse
→ Product
→ Variant
→ Quantity
→ Cart / Buy now
→ Checkout
→ Order created
→ Payment
→ Success
→ Tracking
```

---

## 23. Phần không cần làm trong giai đoạn hiện tại

Không tự phát triển nếu chưa được yêu cầu:

- Customer account.
- Login/Register.
- Loyalty point.
- Wishlist phức tạp.
- Review system.
- Coupon engine phức tạp.
- Multi-vendor.
- Admin dashboard mới.
- Shipping integration mới.
- Payment gateway mới.
- Chat system.
- Subscription.
- Ecommerce cho 3 nhóm còn lại.

---

## 24. Quy trình AI phải làm trước mỗi thay đổi

AI/Agent phải theo workflow sau.

### Step 1 — Đọc yêu cầu

Đọc:

1. File này.
2. Yêu cầu mới nhất của chủ shop.
3. Các file liên quan trong repo.

Không sửa code ngay.

### Step 2 — Xác định scope

Phân loại yêu cầu:

```text
A. Ecommerce /len-soi
→ Được phép xử lý.

B. Protected sections
→ Không sửa nếu chưa có permission.

C. Shared/global component
→ Đánh giá ảnh hưởng trước.
```

### Step 3 — Audit hiện trạng

Trước khi implement:

- Tìm route hiện tại.
- Tìm component liên quan.
- Tìm data source.
- Tìm Supabase integration.
- Tìm Cloudinary integration.
- Kiểm tra type/schema.
- Kiểm tra CSS có thể reuse.
- Kiểm tra feature đã tồn tại chưa.

Không tạo duplicate architecture nếu repo đã có solution phù hợp.

### Step 4 — Lập kế hoạch

Trước khi code, AI nên nêu ngắn:

```text
Files sẽ sửa
Files sẽ tạo
Database/API bị tác động
Shared component bị tác động
Rủi ro
```

Nếu cần sửa protected/global scope ngoài phạm vi cho phép:

**DỪNG và xin phép.**

### Step 5 — Implement tối thiểu

Ưu tiên:

- Reuse.
- Small changes.
- Không rewrite toàn project.
- Không thay global CSS nếu component CSS giải quyết được.
- Không thêm dependency nếu native/existing stack giải quyết được.

Nếu cần dependency mới:

- Nêu tên.
- Nêu lý do.
- Chỉ thêm nếu thực sự cần.

### Step 6 — Không tạo dữ liệu giả production

Không fake:

- Price.
- Stock.
- Promotion.
- Shipping.
- Rating.
- Review.
- Product image.

Nếu dữ liệu chưa tồn tại:

- Dùng development placeholder có nhãn rõ.
- Hoặc báo dữ liệu thiếu.
- Không biến placeholder thành production source.

### Step 7 — Test

Sau thay đổi phù hợp với repo:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Nếu một script không tồn tại hoặc không phù hợp, ghi rõ.

Kiểm tra thủ công tối thiểu:

- Desktop.
- Mobile.
- Product route.
- Cart.
- Checkout.
- Không làm vỡ homepage.
- Không làm vỡ 3 protected sections.

### Step 8 — Báo cáo

Sau khi sửa, báo:

```text
Đã sửa gì
File nào thay đổi
Có thay schema/API không
Có dependency mới không
Test nào đã chạy
Issue nào còn lại
```

Không nói "hoàn tất" nếu build/test vẫn lỗi.

---

## 25. Permission boundary — QUY TẮC QUAN TRỌNG NHẤT

AI không được tự suy luận:

> "Vì đang làm ecommerce nên nên chuyển cả website sang ecommerce."

Điều đó là SAI.

Phạm vi hiện tại:

```text
Len sợi & phụ kiện
= ecommerce
```

Ba phần:

```text
Đồ móc đặt riêng
Hộp quà
Set tự móc
```

**giữ nguyên cho đến khi chủ shop yêu cầu khác.**

Nếu AI thấy cơ hội cải tiến ở ba phần này:

- Có thể đề xuất.
- Không được tự implement.

---

## 26. Khi yêu cầu của chủ shop không dùng thuật ngữ dev

Chủ shop có thể mô tả bằng ngôn ngữ người dùng, ví dụ:

> "Tôi muốn khách chọn len rồi thêm vào giỏ."

AI phải dịch thành yêu cầu kỹ thuật phù hợp, ví dụ:

```text
Product listing
Product detail
Variant selection
Cart state
Cart item model
Checkout flow
Order creation API
```

Nhưng AI không được thay đổi ý định kinh doanh của chủ shop.

Nếu có nhiều cách implement:

- Chọn cách đơn giản, maintainable và phù hợp stack hiện tại.
- Nêu trade-off nếu quyết định ảnh hưởng dữ liệu, security, payment hoặc architecture.

Nếu thiếu thông tin quan trọng mà đoán sai có thể gây hậu quả:

**Hỏi lại trước khi triển khai.**

---

## 27. Definition of Done — Ecommerce `/len-soi`

Một phiên bản ecommerce cơ bản được xem là hoàn chỉnh khi có:

```text
[ ] Category Len / Phụ kiện
[ ] Product listing
[ ] Product detail URL riêng
[ ] Variant selection
[ ] Stock display
[ ] Quantity
[ ] Add to cart
[ ] Buy now
[ ] Cart
[ ] Guest checkout
[ ] Customer shipping info
[ ] Order summary
[ ] Payment method
[ ] Server-side price validation
[ ] Create order
[ ] Unique order code
[ ] Order success page
[ ] Order lookup
[ ] Responsive
[ ] SEO metadata
[ ] Security baseline
[ ] Typecheck/lint/build pass
```

Không bắt buộc trong MVP:

```text
[ ] Customer account
[ ] Reviews
[ ] Loyalty
[ ] Advanced coupon system
[ ] Full admin dashboard
```

---

## 28. Known project decisions

Các quyết định hiện tại:

```text
Framework:
Next.js

Hosting:
Vercel

Database:
Supabase

Image storage:
Cloudinary

Customer authentication:
Không dùng trong MVP

Checkout:
Guest checkout

Cart scope:
Chỉ phần Len sợi & phụ kiện
```

Nếu repository thực tế khác với tài liệu:

- Audit trước.
- Không tự rewrite.
- Báo lại sự khác biệt.

---

## 29. Tóm tắt dành cho AI

Nếu chỉ đọc một đoạn, hãy nhớ:

> Chỉ `/len-soi` được chuyển thành ecommerce.
>
> `/len-soi` gồm Len và Phụ kiện, có product URL riêng, variant, cart, checkout guest, order, payment và tracking.
>
> Giá và stock phải được backend xác minh từ database.
>
> Supabase là database, Cloudinary là nơi chứa ảnh.
>
> Đồ móc đặt riêng, Hộp quà và Set tự móc là protected scope: giữ nguyên, không sửa khi chưa có permission.
>
> Không tự ý sửa global/shared code nếu có thể ảnh hưởng các phần được bảo vệ.
>
> Trước khi code: audit → plan → xác định scope → implement tối thiểu → test → report.
