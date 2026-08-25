import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("order email snapshot reads only persisted order and item snapshot fields", async () => {
  const source = await readFile(new URL("./order-service.ts", import.meta.url), "utf8");
  const snapshotFunction = source.match(
    /export async function getOrderReceivedEmailSnapshot[\s\S]*?\n}\n\nexport async function getOrderItemsSnapshot/
  )?.[0] || "";

  assert.match(snapshotFunction, /\.from\("orders"\)/);
  assert.match(snapshotFunction, /customer_name,email,province,district,ward,address_line,subtotal,shipping_fee,total,payment_method/);
  assert.match(snapshotFunction, /\.from\("order_items"\)/);
  assert.match(snapshotFunction, /product_name_snapshot,variant_name_snapshot,color_code_snapshot,quantity,line_total/);
  assert.doesNotMatch(snapshotFunction, /p_payload|OrderRequest|parsed\.data|payload/);
});
