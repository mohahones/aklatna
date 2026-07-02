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
          { event: "INSERT", schema: "public", table: "businesses" },
          (payload) => {
            if (!isMounted) return;
            setRequests((current) => [mapBusinessRowToRequest(payload.new), ...current]);
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

    const { error } = await supabase
      .from("businesses")
      .update({ is_active: true })
      .eq("id", id);

    if (!error) {
      setRequests((current) =>
        current.map((request) =>
          request.id === id ? { ...request, status: "accepted", is_active: true } : request
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
