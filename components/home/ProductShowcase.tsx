"use client";

import Image from "next/image";
import Link from "next/link";
import type { KeyboardEvent } from "react";
import { useEffect } from "react";
import { trackSiteEvent } from "@/lib/siteTracking";

type ProductCard = {
  id: string;
  type: string;
  className?: string;
  ariaLabel: string;
  image: string;
  imageAlt: string;
  tag: string;
  tagClassName?: string;
  title: string;
  price: string;
  priceClassName?: string;
  description: string;
  modalLabel: string;
  detailHref: string;
  detailLabel: string;
};

const products: ProductCard[] = [
  {
    id: "prod-cuon-len",
    type: "yarn",
    ariaLabel: "Xem cuộn len và phụ kiện tại Tiệm Len Nhà Tiny",
    image: "/images/yarn_collection_800.jpg",
    imageAlt: "Cuộn len và phụ kiện đan móc tại Tiệm Len Nhà Tiny",
    tag: "Bán chạy",
    title: "Cuộn len & phụ kiện",
    price: "Từ 8.000đ",
    description:
      "Bảng màu len siêu xinh, chất sợi mềm mịn (Cotton, Wool...). Đủ kim móc và phụ kiện để bạn tự tay làm nên tác phẩm của mình.",
    modalLabel: "Xem len & phụ kiện →",
    detailHref: "/len-soi-va-phu-kien",
    detailLabel: "Xem len & phụ kiện →"
  },
  {
    id: "prod-moc-yc",
    type: "handmade",
    className: "featured",
    ariaLabel: "Xem đồ móc đặt riêng tại Tiệm Len Nhà Tiny",
    image: "/images/crochet_products_800.jpg",
    imageAlt: "Đồ móc đặt riêng gồm thú bông, túi xách và phụ kiện len tại Tiệm Len Nhà Tiny",
    tag: "Yêu thích nhất",
    tagClassName: "hot",
    title: "Đồ móc đặt riêng",
    price: "Báo giá theo mẫu",
    priceClassName: "quote",
    description:
      "Thú bông Amigurumi, túi xách, mũ nón... Bạn chỉ cần có ý tưởng hoặc ảnh mẫu, Tiny sẽ dùng len biến nó thành hiện thực.",
    modalLabel: "Xem mẫu Tiny đã móc →",
    detailHref: "/san-pham/thu-len-theo-yeu-cau",
    detailLabel: "Xem quy trình đặt móc theo ảnh →"
  },
  {
    id: "prod-qua-tang",
    type: "gift",
    ariaLabel: "Xem hộp quà handmade tại Tiệm Len Nhà Tiny",
    image: "/images/gift_set_800.jpg",
    imageAlt: "Hộp quà handmade từ len và hoa len tại Tiệm Len Nhà Tiny",
    tag: "Quà tặng",
    tagClassName: "gift",
    title: "Hộp quà ý nghĩa",
    price: "Từ 100.000đ",
    description:
      "Một bó hoa len không bao giờ tàn hay set hộp quà mix sẵn cực kỳ mộng mơ. Gói ghém thơm tho thay lời bạn muốn nói.",
    modalLabel: "Xem các set quà →",
    detailHref: "/san-pham/hoa-len-handmade",
    detailLabel: "Khám phá hoa len handmade →"
  },
  {
    id: "prod-set",
    type: "set",
    ariaLabel: "Xem set tự móc tại Tiệm Len Nhà Tiny",
    image: "/images/set_kit_800.jpg",
    imageAlt: "Set tự móc gấu len kèm nguyên liệu và hướng dẫn từ Tiệm Len Nhà Tiny",
    tag: "Mới nhất",
    tagClassName: "hot",
    title: "Set tự móc",
    price: "Từ 100.000đ",
    description:
      "Dành riêng cho người mới bắt đầu! Mỗi set đã gom đủ len, kim móc, bông nhồi và hướng dẫn cực chi tiết để bạn tự vọc vạch.",
    modalLabel: "Xem mẫu tự móc →",
    detailHref: "/san-pham/set-tu-moc",
    detailLabel: "Xem chi tiết set tự móc →"
  }
];

export function ProductShowcase() {
  useEffect(() => {
    let mounted = true;
    import("@/js/products.js").then(({ initProductModal }) => {
      const win = window as Window & { __lentinyProductModalInitialized?: boolean };
      if (mounted && !win.__lentinyProductModalInitialized) {
        initProductModal();
        win.__lentinyProductModalInitialized = true;
      }
    });

    return () => {
      mounted = false;
      document.body.classList.remove("product-modal-open");
      document.body.style.overflow = "";
    };
  }, []);

  const openModal = async (type: string) => {
    document.body.classList.add("product-modal-open");
    const { openProductModal } = await import("@/js/products.js");
    await openProductModal(type);
  };

  const closeModal = async () => {
    const { closeProductModal } = await import("@/js/products.js");
    closeProductModal();
    document.body.classList.remove("product-modal-open");
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, type: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea")) return;
    event.preventDefault();
    openModal(type);
  };

  return (
    <>
      <div className="products-grid">
        {products.map((product) => {
          // Card commerce → navigate thẳng tới catalog umbrella, không mở modal
          if (product.type === "yarn") {
            return (
              <Link
                key={product.id}
                href={product.detailHref}
                className={["product-card", product.className].filter(Boolean).join(" ")}
                id={product.id}
                aria-label={product.ariaLabel}
                data-track="product_card_click"
                data-category={product.type}
                onClick={() => trackSiteEvent("product_card_click", { label: product.title, category: product.type })}
              >
                <div className="product-img-wrap">
                  <Image src={product.image} alt={product.imageAlt} width={800} height={600} sizes="(max-width: 768px) 100vw, 50vw" />
                  <div className={["product-tag", product.tagClassName].filter(Boolean).join(" ")}>{product.tag}</div>
                </div>
                <div className="product-info">
                  <h3>{product.title}</h3>
                  <div className={["product-price", product.priceClassName].filter(Boolean).join(" ")}>{product.price}</div>
                  <p>{product.description}</p>
                  <span className="product-detail-link">Xem len & phụ kiện →</span>
                </div>
              </Link>
            );
          }

          // 3 card còn lại → giữ nguyên modal behavior
          return (
            <div
              key={product.id}
              className={["product-card", product.className].filter(Boolean).join(" ")}
              id={product.id}
              role="button"
              tabIndex={0}
              aria-label={product.ariaLabel}
              style={{ cursor: "pointer" }}
              data-track="product_card_click"
              data-category={product.type}
              data-track-handled="true"
              onClick={() => {
                trackSiteEvent("product_card_click", {
                  label: product.title,
                  category: product.type
                });
                openModal(product.type);
              }}
              onKeyDown={(event) => handleCardKeyDown(event, product.type)}
            >
              <div className="product-img-wrap">
                <Image src={product.image} alt={product.imageAlt} width={800} height={600} sizes="(max-width: 768px) 100vw, 50vw" />
                <div className={["product-tag", product.tagClassName].filter(Boolean).join(" ")}>{product.tag}</div>
              </div>
              <div className="product-info">
                <h3>{product.title}</h3>
                <div className={["product-price", product.priceClassName].filter(Boolean).join(" ")}>{product.price}</div>
                <p>{product.description}</p>
                <Link
                  className="product-detail-link"
                  href={product.detailHref}
                  onClick={(event) => event.stopPropagation()}
                >
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="product-modal-overlay" id="productModal">
        <div
          className="product-modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="productModalTitle"
        >
          <button className="product-modal-close" type="button" aria-label="Đóng danh sách sản phẩm" onClick={closeModal}>
            x
          </button>
          <h2 className="product-modal-title" id="productModalTitle">
            Sản phẩm
          </h2>
          <div className="modal-search-wrap">
            <div className="search-box">
              <span className="search-icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input type="text" id="modalSearchInput" placeholder="Tìm kiếm trong danh mục này..." />
            </div>
            <div className="filter-tabs" id="modalFilterTabs" />
          </div>
          <div className="product-gallery" id="productGallery" />
          <div className="product-modal-actions">
            <Link
              href="/#lien-he-tu-van"
              className="btn btn-primary"
              data-track="modal_order_similar_click"
              onClick={() => closeModal()}
            >
              Liên hệ Tiny tư vấn
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
