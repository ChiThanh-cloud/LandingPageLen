export type InlineLink = {
  type: "link";
  text: string;
  href: string;
};

export type RichText = Array<string | InlineLink>;

export type PostListItem = {
  label?: string;
  text: string;
};

export type RelatedPostLink = {
  slug: string;
  title: string;
  text: string;
};

export type PostSection =
  | {
      type: "paragraphs";
      title?: string;
      paragraphs: RichText[];
    }
  | {
      type: "subsections";
      title: string;
      subsections: Array<{
        title: string;
        paragraphs: RichText[];
      }>;
    }
  | {
      type: "list";
      title: string;
      intro?: RichText;
      items: PostListItem[];
    }
  | {
      type: "callout";
      kicker: string;
      title: string;
      text: string;
      ctaLabel: string;
    }
  | {
      type: "related";
      title: string;
      links: RelatedPostLink[];
    };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  category: string;
  tags: string[];
  searchText: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  eyebrow: string;
  breadcrumbLabel: string;
  h1: string;
  lead: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  ogImage?: string;
  sections: PostSection[];
  legacyPhoneFound?: string;
};
