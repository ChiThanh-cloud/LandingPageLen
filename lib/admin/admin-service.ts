import "server-only";

import { getAdminPageWindow, normalizeAdminPage, type AdminPagination } from "@/lib/admin/admin-pagination";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const ADMIN_ORDER_PAGE_SIZE = 25;
export const ADMIN_PRODUCT_PAGE_SIZE = 25;
export const ADMIN_INVENTORY_PAGE_SIZE = 40;
export const ADMIN_MOVEMENT_PAGE_SIZE = 25;

export type AdminOrderFilters = {
  query?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  page?: number;
  pageSize?: number;
};

export type AdminOrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  subtotal: number | string;
  shipping_fee: number | string | null;
  total: number | string | null;
  payment_method: string;
  payment_status: string;
  order_status: string;
  inventory_attention_required: boolean;
  created_at: string;
};

export type AdminOrderDetail = AdminOrderRow & {
  email: string | null;
  province: string;
  district: string;
  ward: string;
  address_line: string;
  shipping_note: string | null;
  stock_confirmation_required: boolean;
  inventory_reconciled_at: string | null;
  order_items: Array<{
    id: string;
    product_id: number | string;
    variant_id: number | string;
    product_name_snapshot: string;
    variant_name_snapshot: string;
    color_code_snapshot: string | null;
    unit_price: number | string;
    quantity: number;
    line_total: number | string;
  }>;
};

export type AdminProductFilters = {
  query?: string;
  category?: string;
  page?: number;
  editId?: number;
};

export type AdminProductSummary = {
  id: number | string;
  name: string | null;
  category: string | null;
  sub_category: string | null;
  image_url: string | null;
  price: number | string | null;
  status: string | null;
  sort_order: number | null;
  created_at: string;
};

export type AdminProductRecord = AdminProductSummary & {
  full_image_url: string | null;
  weight: string | null;
  yarn_size: string | null;
  material: string | null;
  crochet_hook: string | null;
  origin: string | null;
  description: string | null;
};

export type AdminVariantRecord = {
  id: number | string;
  product_id: number | string;
  name: string;
  color_code: string | null;
  color_name: string | null;
  sku: string | null;
  image_url: string | null;
  full_image_url: string | null;
  status: string | null;
  sort_order: number | null;
};

export type AdminInventoryFilters = {
  query?: string;
  productId?: number;
  stock?: "all" | "in-stock" | "out-of-stock" | "unmanaged";
  page?: number;
  movementPage?: number;
};

export type AdminInventoryProduct = {
  id: number | string;
  name: string | null;
  status: string | null;
};

export type AdminInventoryVariant = {
  id: number | string;
  product_id: number | string;
  name: string;
  color_name: string | null;
  color_code: string | null;
  image_url: string | null;
  stock: number | null;
  status: string | null;
  sort_order: number | null;
};

export type AdminInventoryMovement = {
  id: string;
  variant_id: number | string;
  movement_type: string;
  quantity_delta: number | null;
  stock_before: number | null;
  stock_after: number | null;
  note: string | null;
  created_at: string;
  variant: Pick<AdminInventoryVariant, "id" | "name" | "color_name" | "color_code"> | null;
};

function adminClient() {
  const client = getSupabaseAdminClient();
  if (!client) throw new Error("ADMIN_SERVICE_UNAVAILABLE");
  return client;
}

export type AdminDashboardMetrics = {
  pendingConfirmation: number;
  pendingPayment: number;
  confirmed: number;
  shipping: number;
  paid: number;
  completed: number;
  cancelled: number;
  ordersToday: number;
  paidRevenueToday: number;
};

export async function getAdminDashboard(): Promise<AdminDashboardMetrics> {
  const { data, error } = await adminClient()
    .rpc("get_admin_dashboard_metrics");

  if (error) throw error;

  const value = (data ?? {}) as Partial<AdminDashboardMetrics>;

  return {
    pendingConfirmation: Number(value.pendingConfirmation ?? 0),
    pendingPayment: Number(value.pendingPayment ?? 0),
    confirmed: Number(value.confirmed ?? 0),
    shipping: Number(value.shipping ?? 0),
    paid: Number(value.paid ?? 0),
    completed: Number(value.completed ?? 0),
    cancelled: Number(value.cancelled ?? 0),
    ordersToday: Number(value.ordersToday ?? 0),
    paidRevenueToday: Number(value.paidRevenueToday ?? 0)
  };
}

export async function getAdminOrders(filters: AdminOrderFilters = {}) {
  const page = normalizeAdminPage(filters.page);
  const pageSize = Math.min(50, Math.max(10, filters.pageSize || ADMIN_ORDER_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = adminClient()
    .from("orders")
    .select("id,order_code,customer_name,phone,subtotal,shipping_fee,total,payment_method,payment_status,order_status,inventory_attention_required,created_at", { count: "exact" });

  if (filters.query?.trim()) {
    const safe = filters.query.trim().replace(/[%_,]/g, "");
    query = query.or(`order_code.ilike.%${safe}%,customer_name.ilike.%${safe}%`);
  }
  if (filters.status && filters.status !== "all") query = query.eq("order_status", filters.status);
  if (filters.paymentMethod && filters.paymentMethod !== "all") query = query.eq("payment_method", filters.paymentMethod);
  if (filters.paymentStatus && filters.paymentStatus !== "all") query = query.eq("payment_status", filters.paymentStatus);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    rows: (data || []) as AdminOrderRow[],
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  };
}

export async function getAdminOrder(orderCode: string) {
  const { data, error } = await adminClient()
    .from("orders")
    .select("id,order_code,customer_name,phone,email,province,district,ward,address_line,shipping_note,subtotal,shipping_fee,total,payment_method,payment_status,order_status,stock_confirmation_required,inventory_attention_required,inventory_reconciled_at,created_at,order_items(id,product_id,variant_id,product_name_snapshot,variant_name_snapshot,color_code_snapshot,unit_price,quantity,line_total)")
    .eq("order_code", orderCode)
    .maybeSingle();
  if (error) throw error;
  return data as AdminOrderDetail | null;
}

export async function getAdminInventory(filters: AdminInventoryFilters = {}) {
  const client = adminClient();
  const { data: products, error: productError } = await client
    .from("products")
    .select("id,name,status")
    .eq("category", "yarn")
    .order("sort_order", { ascending: true });
  if (productError) throw productError;

  const productRows = (products || []) as AdminInventoryProduct[];
  const productIds = productRows.map((product) => product.id);
  const requestedPage = normalizeAdminPage(filters.page);
  const requestedMovementPage = normalizeAdminPage(filters.movementPage);

  const buildVariantQuery = (page: number) => {
    const pageFrom = (page - 1) * ADMIN_INVENTORY_PAGE_SIZE;
    let query = client
      .from("product_variants")
      .select("id,product_id,name,color_name,color_code,image_url,stock,status,sort_order", { count: "exact" })
      .in("product_id", productIds.length ? productIds : [-1]);

    if (filters.productId && productIds.some((id) => String(id) === String(filters.productId))) {
      query = query.eq("product_id", filters.productId);
    }
    if (filters.query?.trim()) {
      const safe = filters.query.trim().replace(/[%_,]/g, "");
      if (safe) query = query.or(`name.ilike.%${safe}%,color_name.ilike.%${safe}%,color_code.ilike.%${safe}%,sku.ilike.%${safe}%`);
    }
    if (filters.stock === "in-stock") query = query.gt("stock", 0);
    if (filters.stock === "out-of-stock") query = query.eq("stock", 0);
    if (filters.stock === "unmanaged") query = query.is("stock", null);

    return query
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
      .range(pageFrom, pageFrom + ADMIN_INVENTORY_PAGE_SIZE - 1);
  };

  const buildMovementQuery = (page: number) => {
    const pageFrom = (page - 1) * ADMIN_MOVEMENT_PAGE_SIZE;
    return client
      .from("inventory_movements")
      .select("id,variant_id,movement_type,quantity_delta,stock_before,stock_after,note,created_at,variant:product_variants!inventory_movements_variant_id_fkey(id,name,color_name,color_code)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(pageFrom, pageFrom + ADMIN_MOVEMENT_PAGE_SIZE - 1);
  };

  const [{ data: variants, error: variantError, count: variantCount }, { data: movements, error: movementError, count: movementCount }] = await Promise.all([
    buildVariantQuery(requestedPage),
    buildMovementQuery(requestedMovementPage)
  ]);
  if (variantError && variantError.code !== "PGRST103") throw variantError;
  if (movementError && movementError.code !== "PGRST103") throw movementError;

  let variantRows = variants || [];
  let variantTotal = variantCount || 0;
  if (variantError?.code === "PGRST103") {
    const firstPage = await buildVariantQuery(1);
    if (firstPage.error) throw firstPage.error;
    variantRows = firstPage.data || [];
    variantTotal = firstPage.count || 0;
  }
  const variantWindow = getAdminPageWindow(variantTotal, requestedPage, ADMIN_INVENTORY_PAGE_SIZE);
  if (variantTotal > 0 && variantWindow.pagination.page !== requestedPage && variantWindow.pagination.page > 1) {
    const lastPage = await buildVariantQuery(variantWindow.pagination.page);
    if (lastPage.error) throw lastPage.error;
    variantRows = lastPage.data || [];
  }

  let movementRows = movements || [];
  let movementTotal = movementCount || 0;
  if (movementError?.code === "PGRST103") {
    const firstPage = await buildMovementQuery(1);
    if (firstPage.error) throw firstPage.error;
    movementRows = firstPage.data || [];
    movementTotal = firstPage.count || 0;
  }
  const movementWindow = getAdminPageWindow(movementTotal, requestedMovementPage, ADMIN_MOVEMENT_PAGE_SIZE);
  if (movementTotal > 0 && movementWindow.pagination.page !== requestedMovementPage && movementWindow.pagination.page > 1) {
    const lastPage = await buildMovementQuery(movementWindow.pagination.page);
    if (lastPage.error) throw lastPage.error;
    movementRows = lastPage.data || [];
  }

  return {
    products: productRows,
    variants: variantRows as AdminInventoryVariant[],
    movements: movementRows as unknown as AdminInventoryMovement[],
    pagination: variantWindow.pagination,
    movementPagination: movementWindow.pagination
  };
}

export async function getAdminProducts(filters: AdminProductFilters = {}) {
  const client = adminClient();
  const requestedPage = normalizeAdminPage(filters.page);
  const editId = filters.editId && Number.isInteger(filters.editId) && filters.editId > 0 ? filters.editId : null;

  const buildProductQuery = (page: number) => {
    const pageFrom = (page - 1) * ADMIN_PRODUCT_PAGE_SIZE;
    let query = client
      .from("products")
      .select("id,name,category,sub_category,image_url,price,status,sort_order,created_at", { count: "exact" });
    if (filters.query?.trim()) {
      const safe = filters.query.trim().replace(/[%_,]/g, "");
      if (safe) query = query.ilike("name", `%${safe}%`);
    }
    if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
    return query
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(pageFrom, pageFrom + ADMIN_PRODUCT_PAGE_SIZE - 1);
  };

  const selectedProductPromise = editId
    ? client
      .from("products")
      .select("id,name,category,sub_category,image_url,full_image_url,weight,yarn_size,material,crochet_hook,origin,description,price,status,sort_order,created_at")
      .eq("id", editId)
      .maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const selectedVariantsPromise = editId
    ? client
      .from("product_variants")
      .select("id,product_id,name,color_code,color_name,sku,image_url,full_image_url,status,sort_order")
      .eq("product_id", editId)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const [{ data: products, error: productError, count }, selectedResult, variantResult] = await Promise.all([
    buildProductQuery(requestedPage),
    selectedProductPromise,
    selectedVariantsPromise
  ]);
  if (productError && productError.code !== "PGRST103") throw productError;
  if (selectedResult.error) throw selectedResult.error;
  if (variantResult.error) throw variantResult.error;

  let productRows = products || [];
  let productTotal = count || 0;
  if (productError?.code === "PGRST103") {
    const firstPage = await buildProductQuery(1);
    if (firstPage.error) throw firstPage.error;
    productRows = firstPage.data || [];
    productTotal = firstPage.count || 0;
  }
  const window = getAdminPageWindow(productTotal, requestedPage, ADMIN_PRODUCT_PAGE_SIZE);
  if (productTotal > 0 && window.pagination.page !== requestedPage && window.pagination.page > 1) {
    const lastPage = await buildProductQuery(window.pagination.page);
    if (lastPage.error) throw lastPage.error;
    productRows = lastPage.data || [];
  }
  return {
    products: productRows as AdminProductSummary[],
    selectedProduct: selectedResult.data as AdminProductRecord | null,
    variants: (variantResult.data || []) as AdminVariantRecord[],
    pagination: window.pagination as AdminPagination
  };
}
