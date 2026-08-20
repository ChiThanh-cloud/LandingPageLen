import assert from "node:assert/strict";
import test from "node:test";
import { getAdminPageWindow, normalizeAdminPage } from "./admin-pagination";

test("admin pagination resolves page 1 and page 2 with inclusive database ranges", () => {
  assert.deepEqual(getAdminPageWindow(60, 1, 25), {
    pagination: { page: 1, pageSize: 25, total: 60, totalPages: 3 },
    from: 0,
    to: 24
  });
  assert.deepEqual(getAdminPageWindow(60, 2, 25), {
    pagination: { page: 2, pageSize: 25, total: 60, totalPages: 3 },
    from: 25,
    to: 49
  });
});

test("admin pagination normalizes invalid pages and clamps pages above the maximum", () => {
  for (const value of [undefined, "", "abc", 0, -5, Number.NaN]) {
    assert.equal(normalizeAdminPage(value), 1);
  }
  assert.deepEqual(getAdminPageWindow(52, 999, 25), {
    pagination: { page: 3, pageSize: 25, total: 52, totalPages: 3 },
    from: 50,
    to: 74
  });
});

test("empty admin results stay on a stable first page", () => {
  assert.deepEqual(getAdminPageWindow(0, 8, 40), {
    pagination: { page: 1, pageSize: 40, total: 0, totalPages: 1 },
    from: 0,
    to: 39
  });
});
