import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(50, Math.max(10, filters.pageSize || 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = adminClient()
    .from("orders")
    .select("id,order_code,customer_name,phone,subtotal,shipping_fee,total,payment_method,payment_status,order_status,inventory_attention_required,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.query?.trim()) {
    const safe = filters.query.trim().replace(/[%_,]/g, "");
    query = query.or(`order_code.ilike.%${safe}%,customer_name.ilike.%${safe}%`);
  }
  if (filters.status && filters.status !== "all") query = query.eq("order_status", filters.status);
  if (filters.paymentMethod && filters.paymentMethod !== "all") query = query.eq("payment_method", filters.paymentMethod);
  if (filters.paymentStatus && filters.paymentStatus !== "all") query = query.eq("payment_status", filters.paymentStatus);

  const { data, error, count } = await query;
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

export async function getAdminInventory() {
  const client = adminClient();
  const { data: products, error: productError } = await client
    .from("products")
    .select("id,name,status")
    .eq("category", "yarn")
    .order("sort_order", { ascending: true });
  if (productError) throw productError;

  const productIds = (products || []).map((product) => product.id);
  if (!productIds.length) return { products: [], variants: [], movements: [] };

  const [{ data: variants, error: variantError }, { data: movements, error: movementError }] = await Promise.all([
    client
      .from("product_variants")
      .select("id,product_id,name,color_name,color_code,image_url,stock,status,sort_order")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true }),
    client
      .from("inventory_movements")
      .select("id,variant_id,movement_type,quantity_delta,stock_before,stock_after,note,created_at")
      .order("created_at", { ascending: false })
      .limit(200)
  ]);
  if (variantError) throw variantError;
  if (movementError) throw movementError;
  return { products: products || [], variants: variants || [], movements: movements || [] };
}

export async function getAdminProducts() {
  const client = adminClient();
  const [{ data: products, error: productError }, { data: variants, error: variantError }] = await Promise.all([
    client.from("products").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    client.from("product_variants").select("*").order("sort_order", { ascending: true })
  ]);
  if (productError) throw productError;
  if (variantError) throw variantError;
  return { products: products || [], variants: variants || [] };
}
