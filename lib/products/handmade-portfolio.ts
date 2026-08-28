import "server-only";

import { cache } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type HandmadePortfolioItem = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string | null;
  image: string;
  fullImage: string;
  imageAlt: string;
};

type HandmadeProductRow = {
  id: number | string;
  name: string | null;
  sub_category: string | null;
  description: string | null;
  cover_image: string | null;
  image_url: string | null;
  full_image_url: string | null;
};

const categoryLabels: Record<string, string> = {
  gau: "Thú và nhân vật",
  hoa: "Hoa len",
  tui: "Túi len",
  phu_kien: "Phụ kiện nhỏ",
  khac: "Mẫu khác"
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

function getDisplayCategory(row: HandmadeProductRow) {
  const sourceCategory = normalizeText(row.sub_category?.trim() || "");
  if (sourceCategory === "gau" || sourceCategory === "hoa" || sourceCategory === "tui") {
    return sourceCategory;
  }

  const name = normalizeText(row.name || "");
  if (name.includes("tui")) return "tui";
  if (name.includes("hoa")) return "hoa";
  if (/(moc khoa|non|kep|phu kien)/.test(name)) return "phu_kien";
  if (/(gau|tho|heo|vit|de|ngua|doll|phat|nhan vat|mochi)/.test(name)) return "gau";
  return "khac";
}

async function loadHandmadePortfolio(): Promise<HandmadePortfolioItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id,name,sub_category,description,cover_image,image_url,full_image_url")
    .eq("category", "handmade")
    .neq("status", "hidden")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    console.error("Unable to load handmade portfolio from Supabase", error);
    return [];
  }

  return (data as HandmadeProductRow[]).flatMap((row) => {
    const name = row.name?.trim();
    const image = row.cover_image?.trim() || row.image_url?.trim() || row.full_image_url?.trim();
    if (!name || !image) return [];

    const category = getDisplayCategory(row);
    return [{
      id: String(row.id),
      name,
      category,
      categoryLabel: categoryLabels[category],
      description: row.description?.trim() || null,
      image,
      fullImage: row.full_image_url?.trim() || image,
      imageAlt: `${name} do Tiệm Len Nhà Tiny thực hiện theo yêu cầu`
    }];
  });
}

export const getHandmadePortfolio = cache(loadHandmadePortfolio);
