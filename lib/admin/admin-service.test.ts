import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const servicePath = new URL("./admin-service.ts", import.meta.url);
const serviceCode = readFileSync(servicePath, "utf8");

test("Dashboard metric RPC output mapping đúng", () => {
  // Check RPC usage
  assert.match(serviceCode, /\.rpc\("get_admin_dashboard_metrics"\)/);
  
  // Check mapping logic
  assert.match(serviceCode, /pendingConfirmation:\s*Number\(value\.pendingConfirmation\s*\?\?\s*0\)/);
  assert.match(serviceCode, /pendingPayment:\s*Number\(value\.pendingPayment\s*\?\?\s*0\)/);
  assert.match(serviceCode, /confirmed:\s*Number\(value\.confirmed\s*\?\?\s*0\)/);
  assert.match(serviceCode, /ordersToday:\s*Number\(value\.ordersToday\s*\?\?\s*0\)/);
  assert.match(serviceCode, /paidRevenueToday:\s*Number\(value\.paidRevenueToday\s*\?\?\s*0\)/);
});

test("getAdminDashboard không fetch toàn bộ orders nữa", () => {
  // We want to make sure getAdminDashboard doesn't contain .from("orders")
  // Let's extract the function body first
  const match = serviceCode.match(/export async function getAdminDashboard\(\)[\s\S]*?return \{/);
  assert.ok(match, "Found getAdminDashboard function");
  assert.doesNotMatch(match[0], /\.from\("orders"\)/);
});

test("Pagination logic check", () => {
  // page mặc định = 1
  assert.match(serviceCode, /Math\.max\(1,\s*filters\.page\s*\|\|\s*1\)/);
  
  // pageSize mặc định = 25 and cap 50
  assert.match(serviceCode, /Math\.min\(50,\s*Math\.max\(10,\s*filters\.pageSize\s*\|\|\s*25\)\)/);
  
  // Range logic for 0..24 etc
  assert.match(serviceCode, /const\s+from\s*=\s*\(page\s*-\s*1\)\s*\*\s*pageSize;/);
  assert.match(serviceCode, /const\s+to\s*=\s*from\s*\+\s*pageSize\s*-\s*1;/);
  assert.match(serviceCode, /\.range\(from,\s*to\)/);

  // Exact count
  assert.match(serviceCode, /\{ count:\s*"exact"\s*\}/);

  // totalPages calculation
  assert.match(serviceCode, /Math\.ceil\(total\s*\/\s*pageSize\)/);
  
  // Check empty list doesn't crash
  assert.match(serviceCode, /rows:\s*\(data\s*\|\|\s*\[\]\)/);
  
  // Check filters still applied
  assert.match(serviceCode, /filters\.status\s*&&\s*filters\.status\s*!==\s*"all"/);
  assert.match(serviceCode, /filters\.paymentMethod\s*&&\s*filters\.paymentMethod\s*!==\s*"all"/);
  assert.match(serviceCode, /filters\.paymentStatus\s*&&\s*filters\.paymentStatus\s*!==\s*"all"/);
});

