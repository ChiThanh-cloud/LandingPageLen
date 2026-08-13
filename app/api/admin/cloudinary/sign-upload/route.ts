import { NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedAdmin, type VerifiedAdmin } from "@/lib/admin/auth";
import {
  ADMIN_UPLOAD_TARGETS,
  CloudinaryUploadConfigurationError,
  createAdminSignedUpload,
  type AdminSignedUpload,
  type AdminUploadTarget
} from "@/lib/cloudinary/admin-signed-upload";

export const runtime = "nodejs";

const requestSchema = z.object({
  target: z.enum(ADMIN_UPLOAD_TARGETS)
}).strict();

const noStoreHeaders = { "Cache-Control": "no-store" };

type SignUploadDependencies = {
  getVerifiedAdmin: () => Promise<VerifiedAdmin | null>;
  createSignedUpload: (target: AdminUploadTarget) => AdminSignedUpload;
};

export function createSignUploadHandler(dependencies: SignUploadDependencies) {
  return async function signUpload(request: Request) {
    const admin = await dependencies.getVerifiedAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false }, { status: 401, headers: noStoreHeaders });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false }, { status: 400, headers: noStoreHeaders });
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400, headers: noStoreHeaders });
    }

    try {
      return NextResponse.json(dependencies.createSignedUpload(parsed.data.target), {
        status: 200,
        headers: noStoreHeaders
      });
    } catch (error) {
      if (error instanceof CloudinaryUploadConfigurationError) {
        return NextResponse.json({ ok: false }, { status: 503, headers: noStoreHeaders });
      }

      console.error("Cloudinary upload signing failed", {
        name: error instanceof Error ? error.name : "UnknownError"
      });
      return NextResponse.json({ ok: false }, { status: 503, headers: noStoreHeaders });
    }
  };
}

export const POST = createSignUploadHandler({ getVerifiedAdmin, createSignedUpload: createAdminSignedUpload });
