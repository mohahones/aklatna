import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";

function normalizeStatus(rawStatus) {
  const status = String(rawStatus || "").trim().toLowerCase();

  if (["new", "pending", "received", "queued"].includes(status)) return "new";
  if (["preparing", "in_progress", "processing"].includes(status)) return "preparing";
  if (["ready", "prepared"].includes(status)) return "ready";
  if (["complete", "completed", "delivered", "fulfilled"].includes(status)) return "delivered";
  if (["cancelled", "canceled"].includes(status)) return "cancelled";

  return "new";
}

function resolveDatabaseStatus(nextStatus) {
  const status = String(nextStatus || "").trim().toLowerCase();

  if (["new", "pending", "received", "queued"].includes(status)) return "pending";
  if (["preparing", "in_progress", "processing"].includes(status)) return "preparing";
  if (["ready", "prepared"].includes(status)) return "ready";
  if (["delivered", "complete", "completed", "fulfilled"].includes(status)) return "completed";
  if (["cancelled", "canceled"].includes(status)) return "cancelled";

  return status;
}

function formatOrderTime(dateValue) {
  if (!dateValue) return "الآن";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "الآن";

  return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

async function resolveOrdersTableName() {
  const candidates = ["order", "order", "orders"];

  for (const tableName of candidates) {
    try {
      const { error } = await supabase.from(tableName).select("*").limit(1);
      if (!error) return tableName;
    } catch {
      // Ignore and try the next candidate.
    }
  }

  return null;
}

function parseOrderItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function sortOrdersByCreatedAsc(orders) {
  return [...orders].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
}

function mapOrderFromRow(row) {
  const itemsArray = parseOrderItems(row.items);
  const itemQuantity = itemsArray.reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0);

  const rawOrderType = String(row.order_type || row.orderType || row.type || "").trim().toLowerCase();
  const orderType = rawOrderType === "pickup" ? "استلام من المطعم" : rawOrderType === "delivery" ? "توصيل" : rawOrderType;

  return {
    id: row.id ?? null,
    displayId: row.order_number || (row.id ? `#ORD-${String(row.id).slice(-4)}` : "#ORD-0000"),
    customer: row.customer_name || row.customer || row.name || row.user_name || row.user?.name || "عميل",
    items: Number(row.items_count ?? row.item_count ?? row.total_items ?? itemQuantity ?? 0),
    itemsList: itemsArray,
    total: Number(row.total_price ?? row.total ?? row.amount ?? row.price ?? 0),
    estimatedPreparationTime: Number(row.estimated_preparation_time ?? row.estimatedPreparationTime ?? 0) || null,
    time: formatOrderTime(row.created_at),
    // Support scheduled / pickup time fields commonly used in different schemas
    scheduledFor:
      row.scheduled_for || row.scheduledAt || row.pickup_at || row.pickup_time || row.scheduled_time || row.delivery_time || row.deliver_at || null,
    scheduledTime: formatOrderTime(
      row.scheduled_for || row.scheduledAt || row.pickup_at || row.pickup_time || row.scheduled_time || row.delivery_time || row.deliver_at
    ),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    status: normalizeStatus(row.order_status ?? row.status ?? row.state),
    orderType,
    details: row.description || row.details || row.notes || row.order_notes || row.customer_notes || row.customer_note || "",
    phone: row.customer_phone || row.phone || row.user?.phone || "",
    address: row.delivery_address || row.address || row.user?.address || "",
  };
}

function rowMatchesBusiness(row, businessId) {
  if (!businessId) return false;

  const businessIdValue = String(businessId);
  const candidateFields = [
    row?.business_id,
    row?.restaurant_id,
    row?.owner_id,
    row?.user_id,
    row?.businessId,
    row?.restaurantId,
    row?.ownerId,
  ];

  return candidateFields.some((field) => String(field ?? "") === businessIdValue);
}

async function getCurrentBusinessId() {
  if (!supabase) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (!userError && userData?.user?.id) {
    return userData.user.id;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id ?? null;
}

export default function useOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    async function loadOrders() {
      if (!isSupabaseConfigured || !supabase) {
        setError("Supabase غير مهيأة في هذا المشروع");
        setOrders([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const businessId = await getCurrentBusinessId();
        if (!businessId) {
          if (isMounted) {
            setError("لم يتم العثور على هوية المطعم الحالي");
            setOrders([]);
          }
          return;
        }

        const resolvedTableName = await resolveOrdersTableName();
        if (!resolvedTableName) {
          if (isMounted) {
            setError("لم يتم العثور على جدول الطلبات في قاعدة البيانات");
            setOrders([]);
          }
          return;
        }

        const fetchResult = await supabase.from(resolvedTableName).select("*").order("created_at", { ascending: false });
        let data = fetchResult.data || [];
        let error = fetchResult.error;

        if (!isMounted) return;
        if (error) {
          console.error("Error loading orders:", error);
          setError("تعذر تحميل الطلبات من قاعدة البيانات");
          setOrders([]);
          return;
        }

        const rowsForBusiness = data.filter((row) => rowMatchesBusiness(row, businessId));
        const scheduledCandidates = data.filter((row) =>
          Boolean(row.scheduled_for || row.scheduledAt || row.pickup_at || row.pickup_time || row.scheduled_time || row.delivery_time || row.deliver_at)
        );

        let visibleRows = data;
        if (rowsForBusiness.length > 0) {
          const mapById = new Map();
          for (const row of [...rowsForBusiness, ...scheduledCandidates]) {
            const key = String(row.id ?? "");
            if (!mapById.has(key)) mapById.set(key, row);
          }
          visibleRows = Array.from(mapById.values());
        }

        setError(null);
        setOrders(sortOrdersByCreatedAsc(visibleRows.map(mapOrderFromRow)));

        channel = supabase
          ?.channel(`orders-live-${businessId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: resolvedTableName },
            (payload) => {
              const eventType = payload?.eventType || payload?.type || payload?.event;
              const newRow = payload?.new;
              const oldRow = payload?.old;
              const rowRef = newRow ?? oldRow;

              if (!rowRef || !rowMatchesBusiness(rowRef, businessId)) {
                return;
              }

              const rawOrderId = rowRef?.id;
              if (rawOrderId == null) {
                return;
              }

              if (eventType === "INSERT" && newRow) {
                const nextOrder = mapOrderFromRow(newRow);
                setOrders((current) => sortOrdersByCreatedAsc([nextOrder, ...current.filter((order) => String(order.id) !== String(nextOrder.id))]));
                return;
              }

              if (eventType === "UPDATE" && newRow) {
                setOrders((current) => sortOrdersByCreatedAsc(
                  current.map((order) => (String(order.id) === String(newRow.id) ? mapOrderFromRow(newRow) : order))
                ));
                return;
              }

              if (eventType === "DELETE" && oldRow) {
                setOrders((current) => current.filter((order) => String(order.id) !== String(oldRow.id)));
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Exception loading orders:", err);
        if (isMounted) {
          setError("حدث خطأ أثناء تحميل الطلبات");
          setOrders([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
      if (channel) channel.unsubscribe();
    };
  }, []);

  async function updateOrderStatus(orderId, nextStatus) {
    if (!isSupabaseConfigured || !supabase) return { error: new Error("Supabase غير مهيأة") };

    const originalId = String(orderId).replace("#ORD-", "");
    const numericId = Number(originalId);

    const resolvedTableName = await resolveOrdersTableName();
    if (!resolvedTableName) {
      return { error: new Error("لم يتم العثور على جدول الطلبات") };
    }

    const databaseStatus = resolveDatabaseStatus(nextStatus);
    const normalizedValue = Number.isNaN(numericId) ? originalId : numericId;

    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return { error: new Error("لم يتم العثور على هوية المطعم الحالي") };
    }

    const { data: existingRow, error: rowLookupError } = await supabase
      .from(resolvedTableName)
      .select("id, order_status, business_id")
      .eq("id", normalizedValue)
      .maybeSingle();

    if (rowLookupError) {
      console.error("Error looking up order row for status update:", rowLookupError);
      return { error: rowLookupError };
    }

    if (!existingRow) {
      const missingRowError = new Error("لم يتم العثور على الطلب المطلوب");
      console.error(missingRowError);
      return { error: missingRowError };
    }

    if (!rowMatchesBusiness(existingRow, businessId)) {
      const businessMismatchError = new Error("الطلب لا ينتمي لهذا المطعم");
      console.error(businessMismatchError, existingRow, businessId);
      return { error: businessMismatchError };
    }

    const { error } = await supabase
      .from(resolvedTableName)
      .update({ order_status: databaseStatus })
      .eq("id", normalizedValue);

    if (error) {
      console.error("Error updating order status:", error);
      return { error };
    }

    setOrders((current) =>
      current.map((order) =>
        String(order.id) === String(normalizedValue)
          ? {
              ...order,
              order_status: databaseStatus,
              status: normalizeStatus(databaseStatus),
            }
          : order
      )
    );

    return { error: null };
  }

  async function updateOrderEstimatedTime(orderId, estimatedMinutes) {
    if (!isSupabaseConfigured || !supabase) return { error: new Error("Supabase غير مهيأة") };

    const originalId = String(orderId).replace("#ORD-", "");
    const numericId = Number(originalId);
    const normalizedValue = Number.isNaN(numericId) ? originalId : numericId;

    const resolvedTableName = await resolveOrdersTableName();
    if (!resolvedTableName) {
      return { error: new Error("لم يتم العثور على جدول الطلبات") };
    }

    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return { error: new Error("لم يتم العثور على هوية المطعم الحالي") };
    }

    const { data: existingRow, error: rowLookupError } = await supabase
      .from(resolvedTableName)
      .select("id, business_id")
      .eq("id", normalizedValue)
      .maybeSingle();

    if (rowLookupError) {
      console.error("Error looking up order row for estimated time update:", rowLookupError);
      return { error: rowLookupError };
    }

    if (!existingRow) {
      const missingRowError = new Error("لم يتم العثور على الطلب المطلوب");
      console.error(missingRowError);
      return { error: missingRowError };
    }

    if (!rowMatchesBusiness(existingRow, businessId)) {
      const businessMismatchError = new Error("الطلب لا ينتمي لهذا المطعم");
      console.error(businessMismatchError, existingRow, businessId);
      return { error: businessMismatchError };
    }

    const { error } = await supabase
      .from(resolvedTableName)
      .update({ estimated_preparation_time: estimatedMinutes })
      .eq("id", normalizedValue);

    if (error) {
      console.error("Error updating estimated preparation time:", error);
      return { error };
    }

    setOrders((current) =>
      current.map((order) =>
        String(order.id) === String(normalizedValue)
          ? {
              ...order,
              estimatedPreparationTime: estimatedMinutes,
            }
          : order
      )
    );

    return { error: null, estimatedPreparationTime: estimatedMinutes };
  }

  return {
    orders,
    isLoading,
    error,
    updateOrderStatus,
    updateOrderEstimatedTime,
  };
}
