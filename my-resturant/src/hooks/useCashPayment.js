import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient";
import { mapBusinessRowToRequest } from "../utils/cashPaymentUtils";

export function useCashPayment() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let isMounted = true;
    let subscription;

    async function loadRequestsFromSupabase() {
      if (!isSupabaseConfigured || !supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("1. البيانات الخام:", data, "الخطأ:", error);

      if (!isMounted) return;

      if (!error && Array.isArray(data)) {
        const mappedData = data.map(mapBusinessRowToRequest);
        console.log("2. البيانات بعد التحويل:", mappedData);
        setRequests(mappedData);
      }
    }

    loadRequestsFromSupabase();

    if (isSupabaseConfigured && supabase) {
      subscription = supabase
        .channel("businesses-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "businesses" },
          (payload) => {
            if (!isMounted) return;
            const eventType = payload.event || payload.eventType;

            if (eventType === "INSERT") {
              setRequests((current) => {
                const newRequest = mapBusinessRowToRequest(payload.new);
                return [newRequest, ...current.filter((request) => request.id !== newRequest.id)];
              });
              return;
            }

            if (eventType === "UPDATE") {
              setRequests((current) => {
                const updatedRequest = mapBusinessRowToRequest(payload.new);
                const exists = current.some((request) => request.id === updatedRequest.id);
                if (exists) {
                  return current.map((request) =>
                    request.id === updatedRequest.id ? updatedRequest : request
                  );
                }
                return [updatedRequest, ...current];
              });
              return;
            }

            if (eventType === "DELETE") {
              setRequests((current) =>
                current.filter((request) => request.id !== (payload.old?.id || payload.old?.business_id))
              );
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

    const now = new Date();
    const newExpiresAt = new Date(now);
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    const { error } = await supabase
      .from("businesses")
      .update({
        is_active: true,
        created_at: now.toISOString(),
        expires_at: newExpiresAt.toISOString(),
      })
      .eq("id", id);

    if (!error) {
      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? {
                ...request,
                status: "accepted",
                is_active: true,
                createdAt: now.toISOString(),
                created_at: now.toISOString(),
                date: new Date(now).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
                time: new Date(now).toLocaleTimeString("ar-SA", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : request
        )
      );
    }

    return error;
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
