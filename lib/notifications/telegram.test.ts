import test from "node:test";
import assert from "node:assert/strict";
import {
  sendTelegramNewOrderNotification,
  sendTelegramPaymentPaidNotification,
  sendTelegramOrderCancelledNotification
} from "./telegram";

test("Telegram skips notification gracefully if env variables are missing", async () => {
  // Save original env
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalChatId = process.env.TELEGRAM_CHAT_ID;
  
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;

  try {
    // Should resolve without error
    await assert.doesNotReject(sendTelegramNewOrderNotification({
      orderCode: "TEST-1",
      customerName: "Tiny",
      paymentMethod: "cod",
      itemLines: 1,
      totalQuantity: 2,
      items: []
    }));

    await assert.doesNotReject(sendTelegramPaymentPaidNotification({
      orderCode: "TEST-1",
      amount: 100000
    }));

    await assert.doesNotReject(sendTelegramOrderCancelledNotification({
      orderCode: "TEST-1"
    }));
  } finally {
    // Restore env
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
    process.env.TELEGRAM_CHAT_ID = originalChatId;
  }
});

test("Telegram helper rejects but does not contain secret in error message when HTTP fails", async () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalChatId = process.env.TELEGRAM_CHAT_ID;
  const originalFetch = global.fetch;

  process.env.TELEGRAM_BOT_TOKEN = "fake-token";
  process.env.TELEGRAM_CHAT_ID = "fake-chat";

  global.fetch = async () => {
    return new Response("Unauthorized", { status: 401 });
  };

  try {
    await assert.rejects(
      sendTelegramOrderCancelledNotification({ orderCode: "TEST" }),
      (err: Error) => {
        assert.strictEqual(err.message, "Telegram API request failed");
        assert.doesNotMatch(err.message, /fake-token/);
        assert.doesNotMatch(err.message, /fake-chat/);
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
    process.env.TELEGRAM_CHAT_ID = originalChatId;
  }
});

test("Telegram payload does not contain PII", async () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalChatId = process.env.TELEGRAM_CHAT_ID;
  const originalFetch = global.fetch;

  process.env.TELEGRAM_BOT_TOKEN = "fake-token";
  process.env.TELEGRAM_CHAT_ID = "fake-chat";

  let capturedBody = "";
  
  global.fetch = async (input, init) => {
    capturedBody = init?.body as string;
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    await sendTelegramNewOrderNotification({
      orderCode: "TINY-TEST",
      customerName: "Nguyễn Văn A",
      paymentMethod: "bank_transfer",
      itemLines: 1,
      totalQuantity: 2,
      items: [
        { productName: "Milk Cotton", variantName: "Xanh lá", colorCode: "12", quantity: 2 }
      ]
    });
    
    const parsed = JSON.parse(capturedBody);
    assert.strictEqual(parsed.chat_id, "fake-chat");
    assert.strictEqual(parsed.disable_web_page_preview, true);
    
    // Check that PII is NOT in the text
    assert.match(parsed.text, /TINY-TEST/);
    assert.match(parsed.text, /Nguyễn Văn A/);
    assert.doesNotMatch(parsed.text, /phone/i);
    assert.doesNotMatch(parsed.text, /email/i);
    assert.doesNotMatch(parsed.text, /address/i);
    assert.match(parsed.text, /Milk Cotton/);
    assert.match(parsed.text, /Phân loại: Xanh lá/);
    assert.match(parsed.text, /Mã: 12/);
    assert.match(parsed.text, /SL: 2/);
  } finally {
    global.fetch = originalFetch;
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
    process.env.TELEGRAM_CHAT_ID = originalChatId;
  }
});

test("Telegram new-order copy uses the persisted accessory variant without inventing a colour", async () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalChatId = process.env.TELEGRAM_CHAT_ID;
  const originalFetch = global.fetch;
  process.env.TELEGRAM_BOT_TOKEN = "fake-token";
  process.env.TELEGRAM_CHAT_ID = "fake-chat";
  let capturedBody = "";

  global.fetch = async (_input, init) => {
    capturedBody = init?.body as string;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    await sendTelegramNewOrderNotification({
      orderCode: "TINY-ACCESSORY",
      customerName: "Tiny",
      paymentMethod: "cod",
      itemLines: 1,
      totalQuantity: 2,
      items: [{ productName: "Kim móc cán mềm", variantName: "2.5mm", colorCode: null, quantity: 2 }]
    });

    const text = JSON.parse(capturedBody).text as string;
    assert.match(text, /Kim móc cán mềm/);
    assert.match(text, /Phân loại: 2\.5mm/);
    assert.doesNotMatch(text, /Mã màu: Không có|Không có/);
  } finally {
    global.fetch = originalFetch;
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
    process.env.TELEGRAM_CHAT_ID = originalChatId;
  }
});

test("Telegram paid and cancellation notifications keep their existing copy", async () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalChatId = process.env.TELEGRAM_CHAT_ID;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalFetch = global.fetch;
  process.env.TELEGRAM_BOT_TOKEN = "fake-token";
  process.env.TELEGRAM_CHAT_ID = "fake-chat";
  delete process.env.NEXT_PUBLIC_APP_URL;
  const bodies: string[] = [];

  global.fetch = async (_input, init) => {
    bodies.push(init?.body as string);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    await sendTelegramPaymentPaidNotification({ orderCode: "TINY-PAID", amount: 100_000 });
    await sendTelegramOrderCancelledNotification({ orderCode: "TINY-CANCELLED" });

    assert.equal(JSON.parse(bodies[0]).text, "💰 THANH TOÁN THÀNH CÔNG\n\nMã đơn: TINY-PAID\nSố tiền: 100.000đ\nPhương thức: Chuyển khoản PayOS\n\n✅ Hệ thống đã xác nhận thanh toán.\n");
    assert.equal(JSON.parse(bodies[1]).text, "❌ ĐƠN HÀNG ĐÃ HỦY\n\nMã đơn: TINY-CANCELLED\n\nKhách đã hủy đơn qua website.\n");
  } finally {
    global.fetch = originalFetch;
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
    process.env.TELEGRAM_CHAT_ID = originalChatId;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});
