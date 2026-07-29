# Quy tắc dự án – Tiệm Len Nhà Tiny

## 1. Semantic HTML5 bắt buộc

Khi viết hoặc chỉnh sửa bất kỳ component/page nào trong dự án này, **phải** tuân thủ:

### Thẻ layout & phân vùng
- `<main>` — một lần duy nhất mỗi trang, bao bọc toàn bộ nội dung chính
- `<section>` — nhóm nội dung có chủ đề rõ ràng, **luôn đi kèm heading** (`h2`, `h3`) hoặc `aria-label`
- `<article>` — nội dung độc lập: bài blog, card sản phẩm, review
- `<aside>` — thông tin phụ: sidebar, callout, ghi chú thêm
- `<nav>` — nhóm liên kết điều hướng, không dùng cho bất kỳ `<div class="links">` nào
- `<header>` / `<footer>` — header/footer của trang hoặc của `<article>`, `<section>`

### Thẻ nội dung
- `<figure>` + `<figcaption>` — mọi ảnh có chú thích (feedback ảnh, ảnh sản phẩm)
- `<address>` — thông tin liên hệ/địa chỉ thật của doanh nghiệp
- `<time datetime="…">` — mọi ngày tháng/giờ giấc
- `<dl>` / `<dt>` / `<dd>` — cặp thuật ngữ–định nghĩa, cặp hỏi–đáp (thay vì `<ul><li>` cho FAQ)
- `<details>` + `<summary>` — accordion FAQ (đã dùng đúng, giữ nguyên)
- `<ol>` — quy trình/bước có thứ tự (process steps)
- `<ul>` — danh sách không có thứ tự
- `<blockquote>` — trích dẫn review/feedback dạng text
- `<cite>` — nguồn trích dẫn

### Nghiêm cấm div/span vô nghĩa
- **KHÔNG** dùng `<div>` thuần cho layout khi có thẻ ngữ nghĩa phù hợp
- **KHÔNG** dùng `<span>` để wrap text dài mà không có mục đích styling cụ thể
- **KHÔNG** dùng `<p>` để wrap icon, badge, tag nhỏ — thay bằng `<span>`, `<em>`, `<strong>`
- `<div>` chỉ được dùng khi **không có thẻ nào phù hợp** về ngữ nghĩa (ví dụ: wrapper thuần CSS Grid/Flex không có nghĩa ngữ nghĩa)

---

## 2. Cấu trúc heading nghiêm ngặt

- `<h1>` — **một lần duy nhất** mỗi trang, là tiêu đề chính của trang
- `<h2>` — tiêu đề từng section lớn
- `<h3>` — tiêu đề card, item trong section
- `<h4>`, `<h5>` — tiêu đề phụ sâu hơn
- **KHÔNG** bỏ qua cấp (ví dụ h1 → h3 trực tiếp)
- **KHÔNG** dùng heading chỉ để styling — dùng CSS thay thế

---

## 3. Accessibility bắt buộc

- Mọi `<img>` phải có `alt` mô tả nội dung (không phải tên file)
- Icon SVG decorative phải có `aria-hidden="true"`
- Icon SVG có nghĩa phải có `aria-label` hoặc `<title>` bên trong
- Mọi form input phải có `<label>` liên kết
- Link "Xem thêm", "Đọc bài" phải có `aria-label` rõ ngữ cảnh nếu text ngắn
- Màu tương phản tối thiểu AA (4.5:1 với text thường, 3:1 với text lớn)
- `<button>` cho hành động, `<a>` cho điều hướng — không nhầm lẫn

---

## 4. SEO & AI Search Optimization

### Schema.org JSON-LD
- Trang chủ: `LocalBusiness + Store + WebSite` (đã có — duy trì)
- Trang sản phẩm: `Product` với `offers`, `aggregateRating`
- Trang blog: `Article` với `author`, `datePublished`, `image`
- FAQ section: `FAQPage` schema cho phần `<details>` câu hỏi thường gặp
- BreadcrumbList cho tất cả trang con

### Meta & OpenGraph
- `title` — mô tả + thương hiệu, tối đa 60 ký tự
- `description` — 120–160 ký tự, có từ khóa tự nhiên
- `canonical` — luôn khai báo, dùng `siteConfig.url`
- `og:image` — 1200×630px, alt text rõ ràng

### Nội dung cho AI Search (Google SGE, Perplexity, ChatGPT search...)
- Mỗi `<section>` phải trả lời một câu hỏi cụ thể ("Tiny bán gì?", "Đặt hàng như thế nào?")
- Dùng `<dl>` / `<details>` cho FAQ để AI dễ extract câu trả lời
- Heading phải là câu/cụm từ người dùng thực sự tìm kiếm
- Không dùng heading mơ hồ như "Giới thiệu", "Thông tin"
- Dùng `<strong>` để đánh dấu từ khóa quan trọng trong đoạn text

---

## 5. Quy tắc áp dụng cho từng loại component

| Component | Thẻ bọc ngoài | Ghi chú |
|---|---|---|
| Trust bar item | `<li>` trong `<ul>` | Không dùng `<div>` thuần |
| Process step | `<li>` trong `<ol>` | Quy trình có thứ tự bắt buộc |
| Review/feedback | `<figure>` + `<figcaption>` | Đã đúng, giữ nguyên |
| Blog card | `<article>` | Đã đúng, giữ nguyên |
| Contact info | `<address>` bọc ngoài | Dùng cho thông tin liên hệ doanh nghiệp |
| FAQ | `<details>` + `<summary>` | Đã đúng, giữ nguyên |
| Badge/tag nhỏ | `<span>` | Không dùng `<p>` cho badge |
| About badge overlay | `<aside>` | Thông tin phụ bên cạnh ảnh chính |
| Giờ mở cửa, địa chỉ | `<time>`, `<address>` | Dùng thẻ semantic đúng |

---

## 6. Checklist bắt buộc trước khi commit code HTML/JSX

- [ ] Không có `<div>` nào có thể thay bằng thẻ semantic tốt hơn
- [ ] Heading không bỏ cấp, `<h1>` xuất hiện đúng một lần
- [ ] Mọi `<img>` có `alt` có nghĩa
- [ ] JSON-LD đầy đủ và hợp lệ (dùng https://validator.schema.org)
- [ ] `canonical` đã khai báo đúng
- [ ] FAQ có schema `FAQPage` nếu dùng `<details>`
- [ ] Thẻ `<address>` bọc thông tin liên hệ doanh nghiệp
- [ ] Process steps dùng `<ol>` thay `<div>`
- [ ] Trust bar items dùng `<ul><li>` thay `<div>`
