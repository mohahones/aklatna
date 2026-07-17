import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";

export default function useAdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    async function loadSubscribers() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setError("Supabase غير مهيأة");
          setIsLoading(false);
        }
        return;
      }

      try {
        let query = supabase
          .from("businesses")
          .select("id, name_ar, phone, expires_at, created_at, is_active, renewal_requested_at")
          .eq("is_active", true)
          .not("created_at", "is", null)
          .order("created_at", { ascending: false });

        let { data, error: queryError } = await query;

        if (queryError && /renewal_requested_at/.test(queryError.message || "")) {
          const fallbackResult = await supabase
            .from("businesses")
            .select("id, name_ar, phone, expires_at, created_at, is_active")
            .eq("is_active", true)
            .not("created_at", "is", null)
            .order("created_at", { ascending: false });
          data = fallbackResult.data;
          queryError = fallbackResult.error;
        }

        if (!isMounted) return;

        if (queryError) {
          console.error("Error loading subscribers:", queryError);
          setError("فشل تحميل بيانات المشتركين");
          setSubscribers([]);
        } else {
          setSubscribers(data || []);
          setError(null);
        }
      } catch (err) {
        console.error("Exception loading subscribers:", err);
        if (isMounted) {
          setError("حدث خطأ أثناء تحميل المشتركين");
          setSubscribers([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSubscribers();

    channel = isSupabaseConfigured && supabase
      ? supabase
          .channel("subscribers-status")
          .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, () => loadSubscribers())
          .subscribe()
      : null;

    return () => {
      isMounted = false;
      if (channel) channel.unsubscribe();
    };
  }, []);

  function removeSubscriber(subscriberId) {
    setSubscribers((current) => current.filter((subscriber) => subscriber.id !== subscriberId));
  }

  return { subscribers, isLoading, error, setError, removeSubscriber };
}
