-- Automatic sales aggregation from public."order"
-- Business rule:
--   total_orders = completed_orders + cancelled_orders
--   total_revenue = completed orders only

CREATE OR REPLACE FUNCTION public.normalize_sales_status(status_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE LOWER(TRIM(COALESCE(status_value, 'new')))
    WHEN 'complete' THEN 'completed'
    WHEN 'completed' THEN 'completed'
    WHEN 'delivered' THEN 'completed'
    WHEN 'fulfilled' THEN 'completed'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'canceled' THEN 'cancelled'
    ELSE LOWER(TRIM(COALESCE(status_value, 'new')))
  END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_daily_sales_stats_for_day(
  p_business_id uuid,
  p_sales_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_orders integer;
  v_completed_orders integer;
  v_cancelled_orders integer;
  v_total_revenue numeric;
BEGIN
  IF p_business_id IS NULL OR p_sales_date IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*) FILTER (
      WHERE public.normalize_sales_status(order_status::text) IN ('completed', 'cancelled')
    )::integer,
    COUNT(*) FILTER (
      WHERE public.normalize_sales_status(order_status::text) = 'completed'
    )::integer,
    COUNT(*) FILTER (
      WHERE public.normalize_sales_status(order_status::text) = 'cancelled'
    )::integer,
    COALESCE(SUM(
      CASE
        WHEN public.normalize_sales_status(order_status::text) = 'completed'
        THEN COALESCE(total_price, 0)
        ELSE 0
      END
    ), 0)
  INTO v_total_orders, v_completed_orders, v_cancelled_orders, v_total_revenue
  FROM public."order"
  WHERE business_id = p_business_id
    AND created_at::date = p_sales_date;

  IF v_total_orders = 0 THEN
    DELETE FROM public.daily_sales_stats
    WHERE business_id = p_business_id
      AND sales_date = p_sales_date;
    RETURN;
  END IF;

  INSERT INTO public.daily_sales_stats (
    business_id,
    sales_date,
    total_revenue,
    total_orders,
    completed_orders,
    cancelled_orders,
    average_order_value,
    updated_at
  )
  VALUES (
    p_business_id,
    p_sales_date,
    v_total_revenue,
    v_total_orders,
    v_completed_orders,
    v_cancelled_orders,
    CASE WHEN v_completed_orders > 0
      THEN v_total_revenue / v_completed_orders
      ELSE 0
    END,
    now()
  )
  ON CONFLICT (business_id, sales_date)
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_orders = EXCLUDED.total_orders,
    completed_orders = EXCLUDED.completed_orders,
    cancelled_orders = EXCLUDED.cancelled_orders,
    average_order_value = EXCLUDED.average_order_value,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_daily_top_items_for_day(
  p_business_id uuid,
  p_sales_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_business_id IS NULL OR p_sales_date IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.daily_top_items
  WHERE business_id = p_business_id
    AND sales_date = p_sales_date;

  INSERT INTO public.daily_top_items (
    business_id,
    sales_date,
    menu_item_id,
    item_name,
    quantity_sold,
    revenue
  )
  SELECT
    p_business_id,
    p_sales_date,
    CASE
      WHEN COALESCE(item_data.item_json ->> 'id', item_data.item_json ->> 'menu_item_id', item_data.item_json ->> 'item_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN COALESCE(item_data.item_json ->> 'id', item_data.item_json ->> 'menu_item_id', item_data.item_json ->> 'item_id')::uuid
      ELSE NULL
    END,
    COALESCE(item_data.item_json ->> 'name_ar', item_data.item_json ->> 'name', item_data.item_json ->> 'title', 'Unknown Item'),
    SUM(COALESCE(NULLIF(item_data.item_json ->> 'quantity', '')::integer, NULLIF(item_data.item_json ->> 'qty', '')::integer, 1))::integer,
    SUM(
      COALESCE(NULLIF(item_data.item_json ->> 'quantity', '')::numeric, NULLIF(item_data.item_json ->> 'qty', '')::numeric, 1)
      * COALESCE(NULLIF(item_data.item_json ->> 'price', '')::numeric, NULLIF(item_data.item_json ->> 'unit_price', '')::numeric, 0)
    )
  FROM public."order" AS order_row
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(order_row.items, '[]'::jsonb))
    AS item_data(item_json)
  WHERE order_row.business_id = p_business_id
    AND order_row.created_at::date = p_sales_date
    AND public.normalize_sales_status(order_row.order_status::text) = 'completed'
  GROUP BY
    CASE
      WHEN COALESCE(item_data.item_json ->> 'id', item_data.item_json ->> 'menu_item_id', item_data.item_json ->> 'item_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN COALESCE(item_data.item_json ->> 'id', item_data.item_json ->> 'menu_item_id', item_data.item_json ->> 'item_id')::uuid
      ELSE NULL
    END,
    COALESCE(item_data.item_json ->> 'name_ar', item_data.item_json ->> 'name', item_data.item_json ->> 'title', 'Unknown Item');
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_daily_sales_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.refresh_daily_sales_stats_for_day(OLD.business_id, OLD.created_at::date);
    PERFORM public.refresh_daily_top_items_for_day(OLD.business_id, OLD.created_at::date);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.refresh_daily_sales_stats_for_day(NEW.business_id, NEW.created_at::date);
    PERFORM public.refresh_daily_top_items_for_day(NEW.business_id, NEW.created_at::date);
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_daily_sales_stats ON public."order";
DROP TRIGGER IF EXISTS trigger_update_daily_top_items ON public."order";
DROP TRIGGER IF EXISTS trg_refresh_daily_sales_stats ON public."order";
DROP TRIGGER IF EXISTS trigger_refresh_daily_sales_aggregates ON public."order";

CREATE TRIGGER trigger_refresh_daily_sales_aggregates
AFTER INSERT OR DELETE OR UPDATE OF business_id, created_at, order_status, total_price, items
ON public."order"
FOR EACH ROW
EXECUTE FUNCTION public.refresh_daily_sales_aggregates();

-- One-time synchronization for existing orders.
DO $$
DECLARE
  affected_day record;
BEGIN
  FOR affected_day IN
    SELECT DISTINCT business_id, created_at::date AS sales_date
    FROM public."order"
    WHERE business_id IS NOT NULL
      AND created_at IS NOT NULL
  LOOP
    PERFORM public.refresh_daily_sales_stats_for_day(affected_day.business_id, affected_day.sales_date);
    PERFORM public.refresh_daily_top_items_for_day(affected_day.business_id, affected_day.sales_date);
  END LOOP;
END;
$$;
