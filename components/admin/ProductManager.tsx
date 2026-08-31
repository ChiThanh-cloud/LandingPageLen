"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  deleteProductAction,
  generateCaptionAction,
  importVariantsAction,
  saveProductAction,
  saveVariantAction,
  toggleProductAction,
  toggleVariantAction,
  type ProductAdminActionResult
} from "@/app/admin/(protected)/san-pham/actions";
import {
  ADMIN_PRODUCT_CATEGORIES,
  getProductCategoryCounts,
  getProductCategoryGroups,
  type AdminProductCategory
} from "@/lib/admin/catalog-organization";
import { getProductFormLabels } from "@/lib/admin/product-form-state";
import styles from "./Admin.module.css";

type ProductRecord = {
  id: number | string;
  name: string | null;
  slug: string | null;
  category: string | null;
  sub_category: string | null;
  image_url: string | null;
  full_image_url: string | null;
  weight: string | null;
  yarn_size: string | null;
  material: string | null;
  crochet_hook: string | null;
  origin: string | null;
  description: string | null;
  price: number | string | null;
  status: string | null;
  sort_order: number | null;
  unit_label: string | null;
  option_label: string | null;
};

type VariantRecord = {
  id: number | string;
  product_id: number | string;
  name: string;
  color_code: string | null;
  color_name: string | null;
  sku: string | null;
  image_url: string | null;
  full_image_url: string | null;
  price: number | string | null;
  stock: number | null;
  status: string | null;
  sort_order: number | null;
};

type SignedUploadResponse = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  overwrite: boolean;
};

const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageFileSize = 10 * 1024 * 1024;

const categoryLabels = Object.fromEntries(
  ADMIN_PRODUCT_CATEGORIES.map(({ value, label }) => [value, label])
) as Record<AdminProductCategory, string>;

const statusLabels: Record<string, string> = {
  available: "Còn hàng",
  out: "Hết hàng",
  preorder: "Đặt trước",
  hidden: "Ẩn khỏi web"
};

function formatPrice(value: ProductRecord["price"]) {
  if (value === null || value === "") return "Chưa nhập giá";
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function getFileValidationMessage(file: File) {
  if (!file.type || !allowedImageMimeTypes.has(file.type)) {
    return "Chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc AVIF.";
  }
  if (file.size > maxImageFileSize) {
    return "Ảnh cần nhỏ hơn hoặc bằng 10 MB.";
  }
  return null;
}

function isSignedUploadResponse(value: unknown): value is SignedUploadResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return typeof response.uploadUrl === "string"
    && typeof response.apiKey === "string"
    && typeof response.timestamp === "number"
    && typeof response.signature === "string"
    && typeof response.folder === "string"
    && typeof response.allowedFormats === "string"
    && response.overwrite === false;
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((value) => value.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
  });
}

function importedVariants(text: string) {
  const trimmed = text.trim();
  const input = trimmed.startsWith("[") || trimmed.startsWith("{")
    ? JSON.parse(trimmed)
    : parseCsv(trimmed);
  const rows = Array.isArray(input) ? input : Array.isArray(input.data) ? input.data : [input];
  return rows.map((row: Record<string, unknown>, index: number) => {
    const name = String(row.color_code || row.colorCode || row.code || row.name || `Màu ${index + 1}`).trim();
    const imageUrl = String(row.image_url || row.imageUrl || "").trim();
    const fullImageUrl = String(row.full_image_url || row.fullImageUrl || imageUrl).trim();
    return {
      name,
      color_code: String(row.color_code || row.colorCode || name).trim() || null,
      color_name: String(row.color_name || row.colorName || "").trim() || null,
      sku: String(row.sku || "").trim() || null,
      image_url: imageUrl,
      full_image_url: fullImageUrl || null,
      status: ["available", "out", "preorder", "hidden"].includes(String(row.status)) ? String(row.status) : "available",
      sort_order: Number(row.sort_order ?? row.sortOrder ?? index + 1)
    };
  }).filter((row: { image_url: string }) => /^https?:\/\//i.test(row.image_url));
}

export function ProductManager({ products, variants }: { products: ProductRecord[]; variants: VariantRecord[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | AdminProductCategory>("all");
  const [productCategory, setProductCategory] = useState("handmade");
  const [productLabels, setProductLabels] = useState(() => getProductFormLabels("handmade"));
  const [message, setMessage] = useState<ProductAdminActionResult | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState("");
  const [variantImageUrl, setVariantImageUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const productFormRef = useRef<HTMLFormElement>(null);
  const variantFormRef = useRef<HTMLFormElement>(null);

  const selected = products.find((product) => String(product.id) === selectedId) || null;
  const editingVariant = variants.find((variant) => String(variant.id) === editingVariantId) || null;
  const selectedVariants = selected
    ? variants.filter((variant) => String(variant.product_id) === String(selected.id))
    : [];
  const isOnlineProduct = productCategory === "yarn" || productCategory === "accessory";
  const isYarnProduct = selected?.category === "yarn";
  const supportsVariants = selected?.category === "yarn" || selected?.category === "accessory";
  const variantNoun = isYarnProduct ? "mã màu" : "lựa chọn";
  const variantNameLabel = isYarnProduct ? "Tên / mã" : "Tên phiên bản / giá trị lựa chọn";
  const categoryCounts = useMemo(() => getProductCategoryCounts(products), [products]);
  const productGroups = useMemo(() => getProductCategoryGroups(products, search, category), [category, products, search]);
  const filteredCount = useMemo(
    () => productGroups.reduce((total, group) => total + group.products.length, 0),
    [productGroups]
  );

  function run(action: () => Promise<ProductAdminActionResult>, after?: (result: ProductAdminActionResult) => void) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result);
        after?.(result);
      } catch {
        setMessage({ ok: false, message: "Phiên quản trị không còn hợp lệ hoặc hệ thống chưa sẵn sàng." });
      }
    });
  }

  function chooseProduct(product: ProductRecord | null) {
    const nextCategory = product?.category || "handmade";
    setSelectedId(product ? String(product.id) : null);
    setProductCategory(nextCategory);
    setProductLabels(getProductFormLabels(nextCategory, product));
    setEditingVariantId(null);
    setProductImageUrl(product?.image_url || "");
    setVariantImageUrl("");
    setMessage(null);
    requestAnimationFrame(() => productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function chooseProductCategory(nextCategory: string) {
    setProductCategory(nextCategory);
    setProductLabels(getProductFormLabels(nextCategory));
  }

  function chooseVariant(variant: VariantRecord | null) {
    setEditingVariantId(variant ? String(variant.id) : null);
    setVariantImageUrl(variant?.image_url || "");
    requestAnimationFrame(() => variantFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  async function uploadImage(file: File | undefined, target: "product" | "variant") {
    if (!file) return setMessage({ ok: false, message: "Hãy chọn một file ảnh." });
    const validationMessage = getFileValidationMessage(file);
    if (validationMessage) return setMessage({ ok: false, message: validationMessage });

    setUploading(target);
    setMessage(null);
    try {
      const signResponse = await fetch("/api/admin/cloudinary/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target })
      });
      const signedPayload: unknown = await signResponse.json().catch(() => null);
      if (!signResponse.ok || !isSignedUploadResponse(signedPayload)) {
        throw new Error("Không thể tạo quyền upload ảnh. Vui lòng đăng nhập lại hoặc thử lại sau.");
      }

      const signed = signedPayload;
      const data = new FormData();
      data.append("file", file);
      data.append("api_key", signed.apiKey);
      data.append("timestamp", String(signed.timestamp));
      data.append("signature", signed.signature);
      data.append("folder", signed.folder);
      data.append("allowed_formats", signed.allowedFormats);
      data.append("overwrite", String(signed.overwrite));

      const response = await fetch(signed.uploadUrl, { method: "POST", body: data });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || !result || typeof result !== "object" || typeof (result as { secure_url?: unknown }).secure_url !== "string") {
        throw new Error("Upload ảnh thất bại. Vui lòng thử lại.");
      }
      const secureUrl = (result as { secure_url: string }).secure_url;
      if (target === "product") setProductImageUrl(secureUrl);
      else setVariantImageUrl(secureUrl);
      setMessage({ ok: true, message: "Đã upload ảnh. Hãy bấm lưu để cập nhật dữ liệu sản phẩm." });
    } catch (error) {
      setMessage({ ok: false, message: error instanceof Error ? error.message : "Upload ảnh thất bại." });
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className={styles.productWorkspace}>
      <section className={styles.productToolbar} aria-label="Tìm và lọc sản phẩm">
        <label className={styles.productSearch}>
          <span className={styles.srOnly}>Tìm sản phẩm</span>
          <input type="search" placeholder="Tìm theo tên sản phẩm..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <button type="button" onClick={() => chooseProduct(null)}>Sản phẩm mới</button>
        <div className={styles.filterScroller} role="group" aria-label="Lọc sản phẩm theo danh mục">
          <button
            type="button"
            className={category === "all" ? styles.filterChipActive : styles.filterChip}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            <span>Tất cả</span><strong>{categoryCounts.all}</strong>
          </button>
          {ADMIN_PRODUCT_CATEGORIES.map((definition) => (
            <button
              key={definition.value}
              type="button"
              className={category === definition.value ? styles.filterChipActive : styles.filterChip}
              aria-pressed={category === definition.value}
              onClick={() => setCategory(definition.value)}
            >
              <span>{definition.label}</span><strong>{categoryCounts[definition.value]}</strong>
            </button>
          ))}
        </div>
      </section>

      {message?.message ? <p className={message.ok ? styles.success : styles.error} role="status">{message.message}</p> : null}

      <div className={styles.productColumns}>
        <section className={styles.productListPanel} aria-labelledby="product-list-heading">
          <div className={styles.sectionHeading}><h2 id="product-list-heading">Danh sách sản phẩm</h2><span>{filteredCount} sản phẩm</span></div>
          <div className={styles.productList}>
            {productGroups.map((group, groupIndex) => (
              <section className={styles.productCategoryGroup} key={group.value} aria-labelledby={`product-category-${group.value}`}>
                <header className={styles.productCategoryHeader}>
                  <span className={styles.categorySymbol} aria-hidden="true">{String(groupIndex + 1).padStart(2, "0")}</span>
                  <h3 id={`product-category-${group.value}`}>{group.label}</h3>
                  <span>{group.products.length} sản phẩm</span>
                </header>
                <div className={styles.productCategoryItems}>
                  {group.products.map((product) => (
                    <article className={`${styles.productListItem} ${product.status === "hidden" ? styles.mutedItem : ""} ${selectedId === String(product.id) ? styles.selectedItem : ""}`} key={String(product.id)}>
                      <button type="button" className={styles.productSelect} onClick={() => chooseProduct(product)} aria-label={`Sửa ${product.name}`}>
                        <span className={styles.productThumb}>
                          {product.image_url ? <Image src={product.image_url} alt="" width={68} height={68} /> : "Ảnh"}
                        </span>
                        <span><strong>{product.name || "Chưa đặt tên"}</strong><small>{categoryLabels[product.category as AdminProductCategory] || product.category} · {formatPrice(product.price)}</small><small>{statusLabels[product.status || ""] || product.status}</small></span>
                      </button>
                      <div className={styles.compactActions}>
                        <button type="button" disabled={pending} onClick={() => run(() => toggleProductAction(String(product.id), product.status || "available"))}>{product.status === "hidden" ? "Hiện" : "Ẩn"}</button>
                        <button type="button" disabled={pending} onClick={() => run(() => generateCaptionAction(String(product.id)))}>Caption</button>
                        <button type="button" className={styles.dangerButton} disabled={pending} onClick={() => setDeleteId(String(product.id))}>Xóa</button>
                      </div>
                      {deleteId === String(product.id) ? (
                        <div className={styles.inlineConfirm}>
                          <p>Xóa “{product.name}” và các phiên bản thuộc sản phẩm này?</p>
                          <button type="button" onClick={() => setDeleteId(null)}>Giữ lại</button>
                          <button type="button" className={styles.dangerButton} disabled={pending} onClick={() => run(() => deleteProductAction(String(product.id)), (result) => result.ok && setDeleteId(null))}>Xác nhận xóa</button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
            {!productGroups.length ? <p className={styles.empty}>Không có sản phẩm phù hợp.</p> : null}
          </div>
        </section>

        <section className={styles.editorPanel} aria-labelledby="product-editor-heading">
          <div className={styles.sectionHeading}><h2 id="product-editor-heading">{selected ? `Sửa: ${selected.name}` : "Sản phẩm mới"}</h2>{selected ? <button type="button" onClick={() => chooseProduct(null)}>Xóa form</button> : null}</div>
          <form
            ref={productFormRef}
            key={selectedId || "new"}
            className={styles.adminForm}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              run(() => saveProductAction(data), (result) => result.ok && result.id && setSelectedId(result.id));
            }}
          >
            <input type="hidden" name="id" value={selectedId || ""} />
            <label>Tên sản phẩm<input name="name" required maxLength={200} defaultValue={selected?.name || ""} /></label>
            <div className={styles.formGridTwo}>
              <label>Danh mục<select name="category" required value={productCategory} onChange={(event) => chooseProductCategory(event.target.value)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Danh mục con<input name="subCategory" maxLength={80} defaultValue={selected?.sub_category || ""} placeholder="Ví dụ: milk" /></label>
              <label>Slug<input name="slug" maxLength={200} defaultValue={selected?.slug || ""} readOnly={Boolean(selected)} placeholder="Tự tạo từ tên nếu để trống" /></label>
              <label>Trạng thái<select name="status" defaultValue={selected?.status || "available"}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Thứ tự<input name="sortOrder" type="number" min="0" defaultValue={selected?.sort_order ?? 0} /></label>
              <label>Giá<input name="price" inputMode="numeric" defaultValue={selected?.price ?? ""} placeholder="8000 hoặc 8k" /></label>
              <label>Khối lượng<input name="weight" maxLength={120} defaultValue={selected?.weight || ""} /></label>
            </div>
            {isOnlineProduct ? (
              <div className={styles.formGridTwo}>
                <label>Đơn vị bán<input name="unitLabel" required maxLength={80} value={productLabels.unitLabel} onChange={(event) => setProductLabels((labels) => ({ ...labels, unitLabel: event.target.value }))} placeholder="Ví dụ: cuộn, cây, Kg, cặp" /><small>Milk Bò/Nhung Gấu: cuộn; kim móc/kim khâu: cây; bông gòn: Kg; mắt thú: cặp.</small></label>
                <label>Tên lựa chọn<input name="optionLabel" required maxLength={120} value={productLabels.optionLabel} onChange={(event) => setProductLabels((labels) => ({ ...labels, optionLabel: event.target.value }))} placeholder="Ví dụ: Màu, Kích thước, Khối lượng, Phân loại" /><small>Ví dụ accessory: Kích thước, Khối lượng hoặc Phân loại.</small></label>
              </div>
            ) : null}
            {productCategory === "yarn" ? (
              <div className={styles.formGridTwo}>
                <label>Độ dày sợi (len sợi)<input name="yarnSize" maxLength={120} defaultValue={selected?.yarn_size || ""} placeholder="Ví dụ: 2.5mm" /></label>
                <label>Thành phần (len sợi)<input name="material" maxLength={240} defaultValue={selected?.material || ""} placeholder="Ví dụ: 100% Polyester" /></label>
                <label>Kim móc khuyên dùng (len sợi)<input name="hookSize" maxLength={120} defaultValue={selected?.crochet_hook || ""} placeholder="Ví dụ: 2.5–3mm" /></label>
              </div>
            ) : null}
            <div className={styles.formGridTwo}>
              <label>Xuất xứ (nếu có)<input name="origin" maxLength={160} defaultValue={selected?.origin || ""} /></label>
            </div>
            <label>Mô tả sản phẩm<textarea name="description" maxLength={1200} rows={4} defaultValue={selected?.description || ""} /></label>
            <label>Link ảnh Cloudinary<input name="imageUrl" type="url" required value={productImageUrl} onChange={(event) => setProductImageUrl(event.target.value)} /></label>
            <label>Upload ảnh<input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0], "product")} disabled={uploading !== null} /></label>
            <label>Link ảnh lớn<input name="fullImageUrl" type="url" defaultValue={selected?.full_image_url || ""} /></label>
            {productImageUrl ? <Image className={styles.editorPreview} src={productImageUrl} alt="Xem trước ảnh sản phẩm" width={180} height={180} /> : null}
            <button type="submit" disabled={pending || uploading !== null}>{pending ? "Đang lưu…" : "Lưu sản phẩm"}</button>
          </form>
        </section>
      </div>

      {selected && supportsVariants ? (
        <section className={styles.variantSection} aria-labelledby="variant-heading">
          <div className={styles.sectionHeading}><div><h2 id="variant-heading">{isYarnProduct ? "Mã màu" : selected.option_label || "Lựa chọn"} · {selected.name}</h2><p>{selectedVariants.length} {variantNoun}</p></div><button type="button" onClick={() => chooseVariant(null)}>{isYarnProduct ? "Mã màu mới" : "Thêm lựa chọn"}</button></div>
          <div className={styles.variantColumns}>
            <form
              ref={variantFormRef}
              key={editingVariantId || `new-${selectedId}`}
              className={styles.adminForm}
              onSubmit={(event) => {
                event.preventDefault();
                run(() => saveVariantAction(new FormData(event.currentTarget)), (result) => result.ok && chooseVariant(null));
              }}
            >
              <input type="hidden" name="id" value={editingVariantId || ""} />
              <input type="hidden" name="productId" value={String(selected.id)} />
              <div className={styles.formGridTwo}>
                <label>{variantNameLabel}<input name="name" required defaultValue={editingVariant?.name || ""} /></label>
                {isYarnProduct ? <label>Mã màu<input name="colorCode" defaultValue={editingVariant?.color_code || ""} /></label> : null}
                {isYarnProduct ? <label>Tên màu<input name="colorName" defaultValue={editingVariant?.color_name || ""} /></label> : null}
                <label>SKU<input name="sku" defaultValue={editingVariant?.sku || ""} /></label>
                {!isYarnProduct ? <label>Giá phiên bản<input name="price" inputMode="numeric" defaultValue={editingVariant?.price ?? ""} placeholder="Để trống để dùng giá sản phẩm; giá riêng phải lớn hơn 0" /></label> : null}
                <label>Trạng thái<select name="status" defaultValue={editingVariant?.status || "available"}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Thứ tự<input name="sortOrder" type="number" min="0" defaultValue={editingVariant?.sort_order ?? selectedVariants.length + 1} /></label>
              </div>
              <label>Link ảnh<input name="imageUrl" type="url" value={variantImageUrl} onChange={(event) => setVariantImageUrl(event.target.value)} /></label>
              <label>{isYarnProduct ? "Upload ảnh mã màu" : "Upload ảnh phiên bản"}<input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0], "variant")} disabled={uploading !== null} /></label>
              <label>Link ảnh lớn<input name="fullImageUrl" type="url" defaultValue={editingVariant?.full_image_url || ""} /></label>
              <button type="submit" disabled={pending || uploading !== null}>{pending ? "Đang lưu…" : isYarnProduct ? "Lưu mã màu" : "Lưu lựa chọn"}</button>
            </form>
            <div className={styles.variantList}>
              {selectedVariants.map((variant) => (
                <article key={String(variant.id)} className={`${variant.status === "hidden" ? styles.mutedItem : ""} ${editingVariantId === String(variant.id) ? styles.selectedItem : ""}`}>
                  <span className={styles.variantThumb}>{variant.image_url ? <Image src={variant.image_url} alt="" width={52} height={52} /> : "Ảnh"}</span>
                  <span><strong>{isYarnProduct ? variant.color_code || variant.name : variant.name}</strong><small>{isYarnProduct ? variant.color_name || variant.name : variant.sku || "Chưa có SKU"} · {statusLabels[variant.status || ""] || variant.status}</small></span>
                  <div className={styles.compactActions}>
                    <button type="button" onClick={() => chooseVariant(variant)}>Sửa</button>
                    <button type="button" disabled={pending} onClick={() => run(() => toggleVariantAction(String(variant.id), String(selected.id), variant.status || "available"))}>{variant.status === "hidden" ? "Hiện" : "Ẩn"}</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
          {isYarnProduct ? <details className={styles.importPanel}>
            <summary>Import nhanh mã màu bằng JSON hoặc CSV</summary>
            <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Dán JSON từ tool lấy ảnh hoặc CSV có cột color_code,image_url…" />
            <button type="button" disabled={pending || !importText.trim()} onClick={() => {
              try {
                const rows = importedVariants(importText);
                if (!rows.length) return setMessage({ ok: false, message: "Không tìm thấy dòng nào có đường dẫn ảnh hợp lệ." });
                run(() => importVariantsAction(String(selected.id), rows), (result) => result.ok && setImportText(""));
              } catch {
                setMessage({ ok: false, message: "JSON hoặc CSV không đọc được." });
              }
            }}>Import mã màu</button>
          </details> : null}
        </section>
      ) : null}
    </div>
  );
}
