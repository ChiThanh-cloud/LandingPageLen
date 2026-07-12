export type ProductKind = "product" | "service";

export type ProductFaq = {
  question: string;
  answer: string;
};

export type ProductLink = {
  title: string;
  text: string;
  href: string;
};

export type PriceTable = {
  headers: [string, string, string];
  rows: Array<[string, string, string]>;
};

export type ProductSection =
  | {
      type: "text";
      title: string;
      paragraphs: string[];
    }
  | {
      type: "list";
      title: string;
      intro?: string;
      items: Array<{
        label?: string;
        text: string;
      }>;
      outro?: string;
    }
  | {
      type: "priceTable";
      title: string;
      intro?: string;
      table: PriceTable;
      outro?: string;
    }
  | {
      type: "steps";
      title: string;
      steps: Array<{
        title: string;
        text: string;
      }>;
    }
  | {
      type: "occasionGrid";
      title: string;
      items: Array<{
        icon: string;
        label: string;
      }>;
      outro?: string;
    }
  | {
      type: "callout";
      kicker: string;
      title: string;
      text: string;
      ctaLabel: string;
      ctaTrackKey?: string;
    }
  | {
      type: "related";
      title: string;
      links: ProductLink[];
    };

export type ProductEntry = {
  slug: string;
  kind: ProductKind;
  name: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  category: string;
  eyebrow: string;
  h1: string;
  lead: string;
  image: string;
  imageAlt: string;
  ogImage?: string;
  updatedAt: string;
  schemaName: string;
  schemaDescription: string;
  sections: ProductSection[];
  faq: ProductFaq[];
  legacyPhoneFound?: string;
  legacyHadOffer?: boolean;
};
