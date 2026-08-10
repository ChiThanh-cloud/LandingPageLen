import type { YarnProduct, YarnVariant } from "@/types/yarn-product";

const palette = [
  ["kem-sua", "Kem sữa", "#eee7d7"], ["vang-bo", "Vàng bơ", "#eacb72"],
  ["cam-dao", "Cam đào", "#e99b78"], ["hong-phan", "Hồng phấn", "#e8b4bd"],
  ["hong-dau", "Hồng dâu", "#c85c74"], ["do-gach", "Đỏ gạch", "#a94f43"],
  ["do-ruou", "Đỏ rượu", "#733442"], ["tim-khoai-mon", "Tím khoai môn", "#aa91b6"],
  ["tim-nho", "Tím nho", "#65517d"], ["xanh-lavender", "Xanh lavender", "#9eaed1"],
  ["xanh-baby", "Xanh baby", "#a9cce0"], ["xanh-bien", "Xanh biển", "#4f88b8"],
  ["xanh-navy", "Xanh navy", "#29435f"], ["xanh-mint", "Xanh mint", "#a9d4c1"],
  ["xanh-la-non", "Xanh lá non", "#a9bf78"], ["xanh-reu", "Xanh rêu", "#687456"],
  ["nau-sua", "Nâu sữa", "#b58f73"], ["nau-hat-de", "Nâu hạt dẻ", "#775444"],
  ["xam-khoi", "Xám khói", "#85898c"], ["den", "Đen", "#25282b"],
  ["trang", "Trắng", "#f7f7f3"], ["be", "Be", "#cdbda5"],
  ["xanh-ngoc", "Xanh ngọc", "#4f9c91"], ["vang-mu-tat", "Vàng mù tạt", "#b88b37"]
] as const;

function variants(productId: string, image: string): YarnVariant[] {
  return palette.map(([slug, colorName, colorCode]) => ({
    id: `${productId}-${slug}`,
    colorName,
    colorCode,
    image,
    stock: null
  }));
}

export const yarnProducts: YarnProduct[] = [
  {
    id: "milk-cotton-50g", slug: "milk-cotton-50g", name: "Len Milk Cotton 50g", shortName: "Milk Cotton 50g", category: "milk-cotton",
    description: "Sợi mềm, đều và dễ nhìn mũi. Phù hợp móc thú, hoa, túi nhỏ và luyện tay cho người mới.",
    seoDescription: "Len Milk Cotton 50g mềm mịn, bảng 24 màu, phù hợp móc thú và đồ handmade. Chọn màu, số lượng và xem giá sỉ tại Tiệm Len Nhà Tiny.",
    price: 18000, weight: "50g / cuộn", material: "Cotton pha acrylic", hookSize: "2.5-3.5 mm", origin: "Việt Nam",
    image: "/images/yarn_collection_800.jpg", images: ["/images/yarn_collection_800.jpg", "/images/yarn_hero_800.jpg"], updatedAt: "2026-08-09",
    variants: variants("mc50", "/images/yarn_collection_800.jpg"),
    wholesaleTiers: [{ minQuantity: 1, price: 18000, label: "Giá lẻ" }, { minQuantity: 10, price: 16500, label: "Từ 10 cuộn" }, { minQuantity: 30, price: 15000, label: "Từ 30 cuộn" }]
  },
  {
    id: "len-nhung-gau", slug: "len-nhung-gau", name: "Len Nhung Gấu", shortName: "Nhung Gấu", category: "len-nhung",
    description: "Sợi nhung dày, bề mặt mượt, giúp thú bông lên form tròn và êm tay.",
    seoDescription: "Len Nhung Gấu mềm mượt dùng móc thú bông cỡ vừa và lớn. Chọn trong 24 màu và xem giá theo số lượng.",
    price: 32000, weight: "100g / cuộn", material: "Polyester nhung", hookSize: "4.0-6.0 mm", origin: "Trung Quốc",
    image: "/images/yarn_hero_800.jpg", images: ["/images/yarn_hero_800.jpg", "/images/yarn_collection_800.jpg"], updatedAt: "2026-08-09",
    variants: variants("ng", "/images/yarn_hero_800.jpg"),
    wholesaleTiers: [{ minQuantity: 1, price: 32000, label: "Giá lẻ" }, { minQuantity: 10, price: 29500, label: "Từ 10 cuộn" }, { minQuantity: 30, price: 27000, label: "Từ 30 cuộn" }]
  },
  {
    id: "cotton-vietnam-100g", slug: "cotton-vietnam-100g", name: "Len Cotton Việt Nam 100g", shortName: "Cotton Việt Nam", category: "len-cotton",
    description: "Sợi cotton đứng form, hợp móc hoa, túi, lót ly và các sản phẩm cần đường nét rõ.",
    seoDescription: "Len Cotton Việt Nam 100g đứng form, phù hợp móc hoa, túi và phụ kiện. Có 24 màu và giá sỉ theo số lượng.",
    price: 42000, weight: "100g / cuộn", material: "100% cotton", hookSize: "2.0-3.0 mm", origin: "Việt Nam",
    image: "/images/yarn_collection_800.jpg", images: ["/images/yarn_collection_800.jpg", "/images/yarn_hero_800.jpg"], updatedAt: "2026-08-09",
    variants: variants("cvn", "/images/yarn_collection_800.jpg"),
    wholesaleTiers: [{ minQuantity: 1, price: 42000, label: "Giá lẻ" }, { minQuantity: 10, price: 39000, label: "Từ 10 cuộn" }, { minQuantity: 30, price: 36000, label: "Từ 30 cuộn" }]
  },
  {
    id: "milk-cotton-125g", slug: "milk-cotton-125g", name: "Len Milk Cotton 125g", shortName: "Milk Cotton 125g", category: "milk-cotton",
    description: "Cuộn lớn tiết kiệm cho dự án cần nhiều sợi, chất len mềm và bảng màu dễ phối.",
    seoDescription: "Len Milk Cotton 125g cuộn lớn cho thú bông, túi và chăn nhỏ. Chọn 24 màu, kiểm tra tồn kho và giá sỉ.",
    price: 45000, weight: "125g / cuộn", material: "Cotton pha acrylic", hookSize: "3.0-4.0 mm", origin: "Việt Nam",
    image: "/images/yarn_hero_800.jpg", images: ["/images/yarn_hero_800.jpg", "/images/yarn_collection_800.jpg"], updatedAt: "2026-08-09",
    variants: variants("mc125", "/images/yarn_hero_800.jpg"),
    wholesaleTiers: [{ minQuantity: 1, price: 45000, label: "Giá lẻ" }, { minQuantity: 10, price: 42000, label: "Từ 10 cuộn" }, { minQuantity: 30, price: 39000, label: "Từ 30 cuộn" }]
  }
];

export function getAllYarnProducts() { return yarnProducts; }
export function getYarnProductBySlug(slug: string) { return yarnProducts.find((product) => product.slug === slug); }
