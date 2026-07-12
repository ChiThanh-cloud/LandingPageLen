/* =============================================
   LenTiny Chart Shared Utilities
   ============================================= */

(function () {
  "use strict";

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function removeVietnamese(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  function sanitizeSlug(value) {
    return removeVietnamese(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function parseJson(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("[LenTiny ChartSystem] JSON parse error:", error);
      return fallback;
    }
  }

  window.LenTinyChartUtils = {
    clean: clean,
    escapeAttr: escapeAttr,
    escapeHtml: escapeHtml,
    isObject: isObject,
    parseJson: parseJson,
    removeVietnamese: removeVietnamese,
    sanitizeSlug: sanitizeSlug
  };
})();
