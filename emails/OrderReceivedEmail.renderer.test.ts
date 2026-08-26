import assert from "node:assert/strict";
import { render } from "@react-email/render";
import { createElement } from "react";
import test from "node:test";
import { OrderReceivedEmail } from "@/emails/OrderReceivedEmail";
import { orderReceivedEmailPreview } from "@/emails/OrderReceivedEmail.preview";

test("@react-email/render renders the real order-received fixture", async () => {
  const html = await render(createElement(OrderReceivedEmail, orderReceivedEmailPreview));

  assert.ok(html.length > 0);
  assert.match(html, /<html[^>]*lang="vi"/i);
  assert.match(html, /Tiny đã nhận đơn/);
  assert.match(html, /TINY-A1B2C3D4E5F6/);
  assert.match(html, /https:\/\/lentiny\.xyz\/tra-cuu-don-hang/);
  assert.doesNotMatch(html, /null|undefined|NaN/);
});
