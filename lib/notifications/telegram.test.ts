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
      totalQuantity: 2
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
      totalQuantity: 2
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
  } finally {
    global.fetch = originalFetch;
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
    process.env.TELEGRAM_CHAT_ID = originalChatId;
  }
});
