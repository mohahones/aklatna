import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

export function useCashPayment() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let isMounted = true;
    let subscription;

    async function loadRequestsFromSupabase() {
      if (!isSupabaseConfigured || !supabase) {
        return;
      }
      // Fetch pending SIGNUP requests joined with business info (aliased as `business`)
      const { data, error } = await supabase
        .from("subscription_requests")
        .select("*, business:businesses(name, name_ar, is_active, expires_at)")
        .eq("status", "pending")
        .eq("request_type", "SIGNUP")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Error loading subscription_requests:", error);
        setRequests([]);
        return;
      }

      if (Array.isArray(data)) {
        const formatted = data.map((item) => {
          const biz = item.business || item.businesses || null;
          const createdAt = item.created_at || item.createdAt || null;
          const date = createdAt
            ? new Date(createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
            : "غير محدد";
          const time = createdAt
            ? new Date(createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
            : "";

          return {
            ...item,
            // keep businesses shape expected by UI
            businesses: biz,
            // convenience fields used by UI
            restaurantName: biz?.name_ar || biz?.name || "غير معروف",
            status: item.status,
            date,
            time,
          };
        });

        setRequests(formatted);
      }
    }

    loadRequestsFromSupabase();

    if (isSupabaseConfigured && supabase) {
      subscription = supabase
        .channel("subscription-requests-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "subscription_requests" },
          async (payload) => {
            if (!isMounted) return;
            const eventType = payload.event || payload.eventType || payload.type;
            if (eventType === "INSERT") {
              const n = payload.new;
              if (n.request_type === "SIGNUP" && n.status === "pending") {
                try {
                  const { data: row, error: fetchErr } = await supabase
                    .from("subscription_requests")
                    .select("*, business:businesses(name, name_ar, is_active, expires_at)")
                    .eq("id", n.id)
                    .single();

                  if (fetchErr) {
                    console.error("Error fetching inserted subscription_request:", fetchErr);
                    return;
                  }

                  const biz = row.business || row.businesses || null;
                  const createdAt = row.created_at || row.createdAt || null;
                  const date = createdAt
                    ? new Date(createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
                    : "غير محدد";
                  const time = createdAt
                    ? new Date(createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
                    : "";

                  const formatted = {
                    ...row,
                    businesses: biz,
                    restaurantName: biz?.name_ar || biz?.name || "غير معروف",
                    status: row.status,
                    date,
                    time,
                  };

                  setRequests((cur) => [formatted, ...cur.filter((r) => r.id !== formatted.id)]);
                } catch (err) {
                  console.error("Exception handling INSERT payload:", err);
                }
              }
            }

            // On UPDATE: if status changed to approved/rejected remove from pending list
            if (eventType === "UPDATE" && payload?.new) {
              const newRow = payload.new;
              if (newRow.status === "approved" || newRow.status === "rejected") {
                setRequests((cur) => cur.filter((r) => r.id !== newRow.id));
              }
            }

            // On DELETE: remove from list
            if (eventType === "DELETE" && payload?.old) {
              setRequests((cur) => cur.filter((r) => r.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (subscription) {
        supabase?.removeChannel(subscription);
      }
    };
  }, []);

  async function handleApprove(id) {
    if (!isSupabaseConfigured || !supabase) return;

    // id is request id; find associated business id from local state
    const req = requests.find((r) => r.id === id);
    const businessId = req?.business_id || req?.businesses?.id || req?.business?.id;
    if (!businessId) {
      return new Error("Business id not found for request");
    }

    try {
      // fetch existing business expires_at to support stacking
      const { data: biz, error: bizErr } = await supabase
        .from("businesses")
        .select("expires_at")
        .eq("id", businessId)
        .single();

      if (bizErr) {
        console.error("Error fetching business for approve:", bizErr);
        return bizErr;
      }

      const now = new Date();
      let newExpiresAt;
      if (biz?.expires_at) {
        const currentExpires = new Date(biz.expires_at);
        // if current expiry is in future, stack 30 days on top
        if (currentExpires.getTime() > now.getTime()) {
          newExpiresAt = new Date(currentExpires);
          newExpiresAt.setDate(newExpiresAt.getDate() + 30);
        } else {
          // expired or null -> set 30 days from now
          newExpiresAt = new Date(now);
          newExpiresAt.setDate(newExpiresAt.getDate() + 30);
        }
      } else {
        newExpiresAt = new Date(now);
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);
      }

      // 1) activate business and set new expires_at
      const { error: err1 } = await supabase
        .from("businesses")
        .update({ is_active: true, expires_at: newExpiresAt.toISOString() })
        .eq("id", businessId);

      if (err1) {
        console.error("Error activating business:", err1);
        return err1;
      }

      // 2) mark subscription request as approved
      const { error: err2 } = await supabase
        .from("subscription_requests")
        .update({ status: "approved" })
        .eq("id", id);

      if (err2) {
        console.error("Error approving subscription_request:", err2);
        return err2;
      }

      // remove from local pending list
      setRequests((cur) => cur.filter((r) => r.id !== id));

      return null;
    } catch (err) {
      console.error("Exception in handleApprove:", err);
      return err;
    }
  }

  async function handleReject(id) {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // Call the admin RPC that deletes the auth user and cascades deletions.
      const { error } = await supabase.rpc("admin_reject_and_delete_business", {
        p_business_id: id,
      });

      if (error) {
        console.error("admin_reject_and_delete_business error:", error);
        return error;
      }

      // Remove from local state
      setRequests((current) => current.filter((request) => request.id !== id));

      return null;
    } catch (err) {
      console.error("Error calling admin_reject_and_delete_business:", err);
      return err;
    }
  }

  return {
    requests,
    setRequests,
    handleApprove,
    handleReject,
  };
}
