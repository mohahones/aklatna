import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";
import { formatDateTime } from "../../utils/dateUtils";

function formatRenewalRequest(item) {
  const { date, time } = formatDateTime(item.created_at);
  return {
    ...item,
    businesses: item.businesses || null,
    date,
    time,
  };
}

export default function useRenewalRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    async function loadRequests() {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data, error } = await supabase
          .from("subscription_requests")
          .select("*, businesses(name, name_ar, phone, is_active, expires_at)")
          .eq("status", "pending")
          .eq("request_type", "RENEWAL")
          .order("created_at", { ascending: false });

        if (!isMounted) return;
        if (error) {
          console.error("Error loading renewal requests:", error);
          setRequests([]);
          return;
        }

        setRequests((data || []).map(formatRenewalRequest));
      } catch (err) {
        console.error("Exception loading renewal requests:", err);
        if (isMounted) setRequests([]);
      }
    }

    loadRequests();

    channel = supabase
      .channel("subscription-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscription_requests" },
        (payload) => {
          const eventType = payload?.eventType || payload?.type || payload?.event;
          const newRow = payload?.new;
          const oldRow = payload?.old;

          if (eventType === "INSERT" && newRow?.request_type === "RENEWAL" && newRow?.status === "pending") {
            setRequests((current) => [formatRenewalRequest(newRow), ...current]);
            return;
          }

          if (eventType === "UPDATE" && (newRow?.status === "approved" || newRow?.status === "rejected")) {
            setRequests((current) => current.filter((request) => request.id !== newRow.id));
            return;
          }

          if (eventType === "DELETE" && oldRow) {
            setRequests((current) => current.filter((request) => request.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) channel.unsubscribe();
    };
  }, []);

  function removeRequest(requestId) {
    setRequests((current) => current.filter((request) => request.id !== requestId));
  }

  return { requests, removeRequest };
}
