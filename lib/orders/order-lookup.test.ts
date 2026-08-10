import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  lookupCustomerOrder,
  orderLookupRequestSchema,
  type OrderLookupItemRow,
  type OrderLookupOrderRow,
  type OrderLookupRepository
} from "./order-lookup";
import {
  ORDER_LOOKUP_NOT_FOUND_MESSAGE,
  getOrderTimelineProgress
} from "./order-lookup-display";

const orderRow: OrderLookupOrderRow = {
  id: "69994dfa-5d86-43c9-857f-9e8bea71b700",
  order_code: "TINY-ABCDEF123456",
  phone: "090 123.4567",
  created_at: "2026-08-10T03:00:00.000Z",
  order_status: "pending_payment",
  payment_status: "unpaid",
  payment_method: "bank_transfer",
  subtotal: "24200",
  shipping_fee: "30000",
  total: "54200"
};

const itemRows: OrderLookupItemRow[] = [{
  product_name_snapshot: "Milk Bò",
  variant_name_snapshot: "Màu đen",
  color_code_snapshot: "01",
  quantity: 2,
  unit_price: "12100",
  line_total: "24200"
}];

function repositoryFor(
  order: OrderLookupOrderRow | null,
  items = itemRows
) {
  let itemReads = 0;
  const repository: OrderLookupRepository = {
    async findOrderByCode() {
      return order;
    },
    async findItemsByOrderId() {
      itemReads += 1;
      return items;
    }
  };
  return { repository, getItemReads: () => itemReads };
}

const validRequest = orderLookupRequestSchema.parse({
  orderCode: "tiny-abcdef123456",
  phone: "090-123-4567"
});

test("customer order lookup verifies ownership before returning snapshots", async (t) => {
  await t.test("returns the customer DTO for matching order code and phone", async () => {
    const source = repositoryFor(orderRow);
    const result = await lookupCustomerOrder(validRequest, source.repository);

    assert.ok(result);
    assert.equal(source.getItemReads(), 1);
    assert.equal(result.orderCode, "TINY-ABCDEF123456");
    assert.deepEqual(result.items, [{
      productName: "Milk Bò",
      variantName: "Màu đen",
      colorCode: "01",
      quantity: 2,
      unitPrice: 12100,
      lineTotal: 24200
    }]);
    assert.equal(result.subtotal, 24200);
    assert.equal(result.shippingFee, 30000);
    assert.equal(result.total, 54200);
  });

  await t.test("returns the same empty result for a wrong code or wrong phone", async () => {
    const missing = repositoryFor(null);
    assert.equal(await lookupCustomerOrder(validRequest, missing.repository), null);
    assert.equal(missing.getItemReads(), 0);

    const wrongPhone = repositoryFor(orderRow);
    assert.equal(await lookupCustomerOrder({ ...validRequest, phone: "0911234567" }, wrongPhone.repository), null);
    assert.equal(wrongPhone.getItemReads(), 0);
    assert.equal(
      ORDER_LOOKUP_NOT_FOUND_MESSAGE,
      "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại."
    );
  });

  await t.test("canonicalizes stored and submitted phone formatting conservatively", async () => {
    const source = repositoryFor(orderRow);
    assert.ok(await lookupCustomerOrder(
      orderLookupRequestSchema.parse({
        orderCode: orderRow.order_code,
        phone: "090 123-4567"
      }),
      source.repository
    ));
    assert.equal(
      orderLookupRequestSchema.safeParse({
        orderCode: orderRow.order_code,
        phone: "+84 90 123 4567"
      }).data?.phone,
      "+84901234567"
    );
    assert.notEqual("+84901234567", "0901234567");
  });

  await t.test("keeps historical item prices and excludes internal fields", async () => {
    const result = await lookupCustomerOrder(validRequest, repositoryFor({
      ...orderRow,
      phone: "0901234567",
      subtotal: 19800,
      total: 49800
    }, [{ ...itemRows[0], unit_price: 9900, line_total: 19800 }]).repository);

    assert.ok(result);
    assert.equal(result.items[0].unitPrice, 9900);
    assert.deepEqual(Object.keys(result).sort(), [
      "createdAt",
      "items",
      "orderCode",
      "orderStatus",
      "paymentMethod",
      "paymentStatus",
      "shippingFee",
      "subtotal",
      "total"
    ]);
    assert.equal("id" in result, false);
    assert.equal("phone" in result, false);
    assert.equal("providerOrderCode" in result, false);
    assert.equal("reservation" in result, false);
  });
});

test("customer-facing order states map without fake history", () => {
  assert.equal(getOrderTimelineProgress("pending_confirmation"), 0);
  assert.equal(getOrderTimelineProgress("pending_payment"), 0);
  assert.equal(getOrderTimelineProgress("confirmed"), 1);
  assert.equal(getOrderTimelineProgress("shipping"), 2);
  assert.equal(getOrderTimelineProgress("completed"), 3);
  assert.equal(getOrderTimelineProgress("cancelled"), -1);
});

test("order lookup route and existing RLS preserve the security boundary", () => {
  const route = readFileSync(
    new URL("../../app/api/orders/lookup/route.ts", import.meta.url),
    "utf8"
  );
  const migration = readFileSync(
    new URL("../../supabase/migrations/20260810033509_orders_and_inventory_reservations.sql", import.meta.url),
    "utf8"
  );
  const payment = readFileSync(
    new URL("../../components/payments/PayOSPayment.tsx", import.meta.url),
    "utf8"
  );

  assert.match(route, /orderLookupRequestSchema\.safeParse/);
  assert.match(route, /lookupGuestOrder\(parsed\.data\)/);
  assert.match(route, /ORDER_LOOKUP_NOT_FOUND_MESSAGE/);
  assert.doesNotMatch(route, /getSupabaseClient/);
  assert.match(migration, /alter table public\.orders enable row level security/i);
  assert.match(migration, /alter table public\.order_items enable row level security/i);
  assert.match(migration, /revoke all on table public\.orders from anon, authenticated/i);
  assert.match(migration, /revoke all on table public\.order_items from anon, authenticated/i);
  assert.match(payment, /body: JSON\.stringify\(\{ orderCode, phone \}\)/);
  assert.match(payment, /Nhập lại số điện thoại dùng khi đặt hàng/);
});

test("lookup UI includes required customer states without changing protected routes", () => {
  const lookupPage = readFileSync(
    new URL("../../app/tra-cuu-don-hang/OrderLookupPage.tsx", import.meta.url),
    "utf8"
  );
  const header = readFileSync(
    new URL("../../components/layout/Header.tsx", import.meta.url),
    "utf8"
  );

  assert.match(lookupPage, /Đơn hàng đã hủy/);
  assert.match(lookupPage, /thanh toán khi nhận hàng/i);
  assert.match(lookupPage, /PayOSPayment/);
  assert.match(lookupPage, /paymentStatus === "unpaid"/);
  assert.match(header, /href: "\/tra-cuu-don-hang", label: "Tra cứu đơn hàng"/);
  assert.doesNotMatch(header, /do-moc-dat-rieng|hop-qua|set-tu-moc/);
});
