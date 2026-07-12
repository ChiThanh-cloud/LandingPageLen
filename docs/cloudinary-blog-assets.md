# Cloudinary Blog Assets CLI

Công cụ CLI hỗ trợ tự động đổi tên (`public_id`) của hàng loạt ảnh trên Cloudinary và cập nhật lại đường link mới vào source code (`data/posts.ts`).

## Cấu trúc Public ID
- Ảnh bìa (`post.image`): `lentiny/blog/<slug>/cover`
- Ảnh bìa OG (`post.ogImage`): `lentiny/blog/<slug>/og-cover` (nếu khác ảnh cover)
- Ảnh trong bài (`sections`): `lentiny/blog/<slug>/image-01`, `image-02`...

## Biến môi trường
Tạo file `.env` ở root của project (tham khảo `.env.example`):
```env
CLOUDINARY_CLOUD_NAME=djn2kd2hh
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Các câu lệnh hỗ trợ

### 1. Dry Run (Mặc định)
Quét toàn bộ ảnh trong `data/posts.ts` thuộc cloud `djn2kd2hh`, mô phỏng việc sinh `public_id` và kiểm tra preflight (URL đích có rảnh hay không).
```bash
npm run cloudinary:blog-assets -- --dry-run
```

### 2. Apply (Thực thi)
Thực sự gọi API đổi tên ảnh trên Cloudinary. Sẽ tạo thư mục manifest backup lại `data/posts.ts` trước khi đổi tên. Nếu thành công 100%, file `data/posts.ts` sẽ được ghi đè bằng đường link mới.
```bash
npm run cloudinary:blog-assets -- --apply
```

### 3. Rollback
Nếu có lỗi xảy ra hoặc bạn muốn khôi phục lại ảnh và source code như ban đầu, bạn có thể dùng lệnh rollback và trỏ tới file `manifest.json` tương ứng.
```bash
# Kiểm tra dry-run trước khi rollback
npm run cloudinary:blog-rollback -- --manifest ./manifests/cloudinary-blog-assets/<timestamp>/manifest.json --dry-run

# Thực thi rollback
npm run cloudinary:blog-rollback -- --manifest ./manifests/cloudinary-blog-assets/<timestamp>/manifest.json
```

## Cấu trúc Manifest
Mỗi lần chạy `--apply`, một thư mục mới sẽ được tạo trong `manifests/cloudinary-blog-assets/<timestamp>/`. Thư mục này bao gồm:
- `manifest.json`: Chứa mapping toàn bộ ảnh, URL cũ, URL mới, và trạng thái.
- `posts.before.ts`: Bản backup của source file trước khi chạy.
- `posts.after.ts`: Bản lưu của source file sau khi hoàn thành.
