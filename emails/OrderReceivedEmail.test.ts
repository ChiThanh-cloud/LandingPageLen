import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { OrderReceivedEmail } from "@/emails/OrderReceivedEmail";
import { orderReceivedEmailPreview } from "@/emails/OrderReceivedEmail.preview";

test("order-received preview renders Tiny wording, persisted order details, and unknown money safely", () => {
  const html = renderToStaticMarkup(createElement(OrderReceivedEmail, orderReceivedEmailPreview));

  assert.match(html, /Tiệm Len Nhà Tiny/);
  assert.match(html, /Tiny đã nhận đơn của bạn/);
  assert.match(html, /Thông tin đơn hàng của bạn đã được Tiny ghi nhận/);
  assert.match(html, /Nguyễn Thanh/);
  assert.match(html, /TINY-A1B2C3D4E5F6/);
  assert.match(html, /Đã nhận đơn/);
  assert.match(html, /Len Milk Bò/);
  assert.match(html, /Len Nhung Đũa/);
  assert.doesNotMatch(html, /Mã 12 · Mã 12/);
  assert.match(html, /125.000đ/);
  assert.equal((html.match(/Chưa xác nhận/g) || []).length, 2);
  assert.doesNotMatch(html, /(?:null|undefined|NaN|>0đ<)/);
  assert.match(html, /https:\/\/lentiny\.xyz\/tra-cuu-don-hang/);
  assert.match(html, /Thanh toán khi nhận hàng \(COD\)/);
  assert.match(html, /853 Ba Đình, Phường Chánh Hưng, TP\. Hồ Chí Minh/);
  assert.match(html, /036\.890\.3519/);
  assert.match(html, /https:\/\/zalo\.me\/0368903519/);
  assert.match(html, /https:\/\/m\.me\/61559447375156/);
  assert.doesNotMatch(html, /đã được xác nhận/i);
});
