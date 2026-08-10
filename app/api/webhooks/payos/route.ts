import { NextResponse } from "next/server";
import { PaymentFlowError } from "@/lib/payments/payment-core";
import { payOSWebhookSchema } from "@/lib/payments/payment-schema";
import { handlePayOSWebhook } from "@/lib/payments/payment-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const parsed = payOSWebhookSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("Rejected malformed payment webhook");
    return NextResponse.json({ success: false }, { status: 400 });
  }

  try {
    const result = await handlePayOSWebhook(parsed.data);
    return NextResponse.json(
      { success: true, alreadyProcessed: result.alreadyPaid },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof PaymentFlowError) {
      console.warn("Rejected payment webhook", { code: error.code });
      return NextResponse.json(
        { success: false },
        { status: error.status, headers: { "Cache-Control": "no-store" } }
      );
    }

    console.error("Unexpected payment webhook failure", {
      name: error instanceof Error ? error.name : "UnknownError"
    });
    return NextResponse.json(
      { success: false },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

