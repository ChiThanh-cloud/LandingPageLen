export type AdminPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function normalizeAdminPage(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

export function getAdminPageWindow(total: number, requestedPage: unknown, pageSize: number) {
  const safeTotal = Math.max(0, Math.floor(total));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const page = Math.min(normalizeAdminPage(requestedPage), totalPages);
  const from = (page - 1) * safePageSize;

  return {
    pagination: { page, pageSize: safePageSize, total: safeTotal, totalPages } satisfies AdminPagination,
    from,
    to: from + safePageSize - 1
  };
}
