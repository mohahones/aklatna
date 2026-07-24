import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";
import { formatDateTime } from "../../utils/dateUtils";

function formatSignupRequest(item) {
  const biz = item.business || item.businesses || null;
  const createdAt = item.created_at || item.createdAt || null;
  const { date, time } = formatDateTime(createdAt);

  return {
    ...item,
    businesses: biz,
    restaurantName: biz?.name_ar || biz?.name || "غير معروف",
    amount: item.amount ?? biz?.amount ?? 0,
    createdAt,
    date,
    time,
    status: item.status,
  };
}

export function useCashPayment() {
  const [requests, setRequests] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let subscription;

    async function loadRequests() {
      if (!isSupabaseConfigured || !supabase) return;

      // نفس نمط join المستخدم في طلبات التجديد
      const { data, error } = await supabase
        .from("subscription_requests")
        .select("*, businesses(id, name, name_ar, phone)")
        .eq("status", "pending")
        .eq("request_type", "SIGNUP")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Error loading subscription_requests:", error);
        setLoadError(error.message || "فشل تحميل طلبات الدفع النقدي");
        setRequests([]);
        return;
      }

      setLoadError(null);
      setRequests((data || []).map(formatSignupRequest));
    }

    loadRequests();

    if (isSupabaseConfigured && supabase) {
      subscription = supabase
        .channel("subscription-requests-signup")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "subscription_requests" },
          async (payload) => {
            if (!isMounted) return;

            const eventType = payload?.eventType || payload?.type || payload?.event;

            if (eventType === "INSERT" && payload?.new?.request_type === "SIGNUP" && payload?.new?.status === "pending") {
              try {
                const { data: row, error: fetchErr } = await supabase
                  .from("subscription_requests")
                  .select("*, businesses(id, name, name_ar, phone)")
                  .eq("id", payload.new.id)
                  .single();

                if (fetchErr) {
                  console.error("Error fetching inserted request row:", fetchErr);
                  return;
                }

                setRequests((current) => [formatSignupRequest(row), ...current]);
              } catch (err) {
                console.error("Exception fetching inserted row:", err);
              }
              return;
            }

            if (eventType === "UPDATE" && payload?.new) {
              const newRow = payload.new;
              if (newRow.status === "approved" || newRow.status === "rejected") {
                setRequests((current) => current.filter((request) => request.id !== newRow.id));
              }
              return;
            }

            if (eventType === "DELETE" && payload?.old) {
              setRequests((current) => current.filter((request) => request.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (subscription) supabase?.removeChannel(subscription);
    };
  }, []);

  async function handleApprove(id) {
    if (!isSupabaseConfigured || !supabase) return new Error("Supabase not configured");

    try {
      const { error } = await supabase.rpc("admin_approve_signup_request", {
        p_request_id: id,
      });

      if (error) throw error;

      setRequests((current) => current.filter((request) => request.id !== id));
      return null;
    } catch (err) {
      console.error("Approve error:", err);
      return err;
    }
  }

  async function handleReject(id) {
    if (!isSupabaseConfigured || !supabase) return new Error("Supabase not configured");

    try {
      // Try to locate the request to get the related business id
      const target = requests.find((r) => r.id === id);
      const businessId = target?.businesses?.id || target?.business?.id || target?.business_id || null;

      if (businessId) {
        // Use the same RPC used by subscriptions page to delete all business data
        const { error } = await supabase.rpc("admin_reject_and_delete_business", {
          p_business_id: businessId,
        });

        if (error) throw error;
      } else {
        // Fallback: mark the signup request as rejected
        const { error } = await supabase.rpc("admin_reject_signup_request", {
          p_request_id: id,
        });

        if (error) throw error;
      }

      setRequests((current) => current.filter((request) => request.id !== id));
      return null;
    } catch (err) {
      console.error("Reject error:", err);
      return err;
    }
  }

  return { requests, loadError, handleApprove, handleReject };
}

export default useCashPayment;
