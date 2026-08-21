import type { YarnProduct } from "@/types/yarn-product";

export type YarnContentLink = {
  href: string;
  label: string;
  description?: string;
};

type ProductContentConfig = {
  comparison?: YarnContentLink & { heading: string };
  articles: YarnContentLink[];
};

const productContent: Record<string, ProductContentConfig> = {
  "nhung-dua": {
    comparison: {
      heading: "So sánh Len Nhung Đũa và Nhung Gấu",
      href: "/blog/nhung-dua-va-nhung-gau-khac-nhau-the-nao",
      label: "So sánh chi tiết Nhung Đũa và Nhung Gấu",
      description: "Đối chiếu khối lượng, cỡ sợi, thành phần và khoảng kim móc đang công bố."
    },
    articles: [
      {
        href: "/blog/len-nhung-dua-la-gi-soi-6mm-100g-dung-kim-moc-bao-nhieu",
        label: "Len Nhung Đũa 6mm, 100g dùng kim móc bao nhiêu?"
      },
      {
        href: "/blog/nhung-dua-va-nhung-gau-khac-nhau-the-nao",
        label: "Nhung Đũa và Nhung Gấu khác nhau thế nào?"
      },
      {
        href: "/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den",
        label: "Chọn kim móc cho Nhung Đũa và các dòng len tại Tiny"
      }
    ]
  },
  "nhung-gau": {
    comparison: {
      heading: "So sánh Len Nhung Gấu và Nhung Đũa",
      href: "/blog/nhung-dua-va-nhung-gau-khac-nhau-the-nao",
      label: "So sánh chi tiết Nhung Gấu và Nhung Đũa",
      description: "Đối chiếu khối lượng, cỡ sợi, thành phần và khoảng kim móc đang công bố."
    },
    articles: [
      {
        href: "/blog/nhung-dua-va-nhung-gau-khac-nhau-the-nao",
        label: "Nhung Đũa và Nhung Gấu khác nhau thế nào?"
      },
      {
        href: "/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den",
        label: "Chọn kim móc cho Nhung Gấu và các dòng len tại Tiny"
      },
      {
        href: "/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao",
        label: "Người mới học móc len nên chọn loại len nào?"
      }
    ]
  },
  "milk-bo": {
    comparison: {
      heading: "So sánh Milk Bò và Milk Cotton Mác Đen",
      href: "/blog/milk-bo-va-milk-cotton-mac-den-khac-nhau-the-nao",
      label: "So sánh chi tiết Milk Bò và Milk Cotton Mác Đen",
      description: "Đối chiếu khối lượng, cỡ sợi, thành phần và khoảng kim móc đang công bố."
    },
    articles: [
      {
        href: "/blog/milk-bo-va-milk-cotton-mac-den-khac-nhau-the-nao",
        label: "Milk Bò và Milk Cotton Mác Đen khác nhau thế nào?"
      },
      {
        href: "/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den",
        label: "Chọn kim móc cho Milk Bò và các dòng len tại Tiny"
      },
      {
        href: "/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao",
        label: "Người mới học móc len nên chọn loại len nào?"
      }
    ]
  },
  "mac-den": {
    comparison: {
      heading: "So sánh Milk Cotton Mác Đen và Milk Bò",
      href: "/blog/milk-bo-va-milk-cotton-mac-den-khac-nhau-the-nao",
      label: "So sánh chi tiết Milk Cotton Mác Đen và Milk Bò",
      description: "Đối chiếu khối lượng, cỡ sợi, thành phần và khoảng kim móc đang công bố."
    },
    articles: [
      {
        href: "/blog/milk-bo-va-milk-cotton-mac-den-khac-nhau-the-nao",
        label: "Milk Bò và Milk Cotton Mác Đen khác nhau thế nào?"
      },
      {
        href: "/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den",
        label: "Chọn kim móc cho Milk Cotton Mác Đen và các dòng len tại Tiny"
      }
    ]
  }
};

const fallbackArticles: YarnContentLink[] = [
  {
    href: "/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao",
    label: "Người mới học móc len nên chọn loại len nào?"
  },
  {
    href: "/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den",
    label: "Cách đối chiếu cỡ kim móc theo dòng len"
  }
];

const primaryYarnLinks = [
  { slug: "nhung-dua", label: "Len Nhung Đũa" },
  { slug: "nhung-gau", label: "Len Nhung Gấu" },
  { slug: "milk-bo", label: "Len Milk Bò" },
  { slug: "mac-den", label: "Milk Cotton Mác Đen" }
] as const;

function normalizedMaterial(product: YarnProduct) {
  return product.material?.trim().toLocaleLowerCase("vi") || null;
}

export function getYarnProductSeoContent(product: YarnProduct) {
  const config = productContent[product.slug];
  const facts = [
    product.weight ? `khối lượng ${product.weight}` : null,
    product.yarnSize ? `cỡ sợi ${product.yarnSize}` : null,
    product.material ? `thành phần ${product.material}` : null
  ].filter((value): value is string => Boolean(value));

  return {
    summary: facts.length > 0
      ? `${product.shortName} hiện có thông số ${facts.join(", ")}.`
      : product.description,
    hook: product.hookSize
      ? {
          heading: `${product.shortName} nên dùng kim móc bao nhiêu?`,
          text: `Khoảng kim móc đang công bố cho ${product.shortName} là ${product.hookSize}. Hãy ưu tiên yêu cầu của chart và móc thử một mẫu nhỏ trước khi làm toàn bộ sản phẩm.`
        }
      : null,
    chartText: product.yarnSize
      ? `Đối chiếu cỡ sợi ${product.yarnSize} với yêu cầu trong chart. Nếu thay bằng một dòng len có cỡ sợi khác, hãy móc thử và kiểm tra lại kích thước thay vì suy đoán từ tên sản phẩm.`
      : "Đối chiếu thông số trên trang với yêu cầu trong chart và móc thử một mẫu nhỏ trước khi bắt đầu.",
    comparison: config?.comparison ?? null,
    articles: config?.articles ?? fallbackArticles
  };
}

export function getRelatedYarnProducts(
  product: YarnProduct,
  products: YarnProduct[],
  limit = 3
) {
  const productMaterial = normalizedMaterial(product);

  return products
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate.id !== product.id)
    .sort((left, right) => {
      const rank = (candidate: YarnProduct) => {
        if (candidate.category === product.category) return 0;
        if (productMaterial && normalizedMaterial(candidate) === productMaterial) return 1;
        return 2;
      };

      return rank(left.candidate) - rank(right.candidate) || left.index - right.index;
    })
    .slice(0, Math.max(0, limit))
    .map(({ candidate }) => candidate);
}

export function getPrimaryYarnNavigationLinks(products: YarnProduct[]): YarnContentLink[] {
  const availableSlugs = new Set(products.map((product) => product.slug));
  return primaryYarnLinks
    .filter((item) => availableSlugs.has(item.slug))
    .map((item) => ({ href: `/len-soi/${item.slug}`, label: item.label }));
}
