CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
WITH order_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE order_status = 'pending_confirmation') AS pending_confirmation,
    COUNT(*) FILTER (WHERE order_status = 'pending_payment') AS pending_payment,
    COUNT(*) FILTER (WHERE order_status = 'confirmed') AS confirmed,
    COUNT(*) FILTER (WHERE order_status = 'shipping') AS shipping,
    COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid,
    COUNT(*) FILTER (WHERE order_status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE order_status = 'cancelled') AS cancelled,
    COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS orders_today,
    COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date), 0) AS paid_revenue_today
  FROM public.orders
)
SELECT jsonb_build_object(
  'pendingConfirmation', pending_confirmation,
  'pendingPayment', pending_payment,
  'confirmed', confirmed,
  'shipping', shipping,
  'paid', paid,
  'completed', completed,
  'cancelled', cancelled,
  'ordersToday', orders_today,
  'paidRevenueToday', paid_revenue_today
)
FROM order_stats;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO service_role;

CREATE INDEX IF NOT EXISTS orders_created_at_desc_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_order_status_created_at_idx ON public.orders (order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_status_created_at_idx ON public.orders (payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_method_created_at_idx ON public.orders (payment_method, created_at DESC);
