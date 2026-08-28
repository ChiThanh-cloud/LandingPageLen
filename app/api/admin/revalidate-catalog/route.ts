import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductRevalidationPaths } from "@/lib/admin/product-revalidation";

export const runtime = "nodejs";

const requestSchema = z.object({
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(["yarn", "accessory"]).default("yarn")
});

function hasValidSecret(request: Request, expected: string) {
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length
    && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const secret = process.env.CATALOG_REVALIDATE_SECRET?.trim();
  if (!secret) {
    console.error("Catalog revalidation secret is not configured");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (!hasValidSecret(request, secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  for (const path of getProductRevalidationPaths(parsed.data)) {
    revalidatePath(path);
  }
  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
