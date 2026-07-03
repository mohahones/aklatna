import { useEffect, useState, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "../supabaseClient";

export default function useSubscription({ businessId } = {}) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSubscription() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase.from("businesses").select("created_at,expires_at").order("expires_at", { ascending: false }).limit(1);
        if (businessId) query = query.eq("id", businessId);

        const { data, error } = await query;
        if (error) console.warn("Failed to load subscription:", error);
        if (mounted && data && data.length) setSubscription(data[0]);
      } catch (err) {
        console.warn(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSubscription();
    return () => {
      mounted = false;
    };
  }, [businessId]);

  const result = useMemo(() => {
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    if (subscription && subscription.expires_at && subscription.created_at) {
      const expires = new Date(subscription.expires_at);
      const created = new Date(subscription.created_at);
      const total = Math.max(1, Math.round(Math.abs((expires.getTime() - created.getTime()) / msPerDay)));
      let left = Math.ceil((expires.getTime() - now.getTime()) / msPerDay);
      if (left < 0) left = 0;
      const used = Math.max(0, total - left);
      const percent = Math.min(100, Math.round((used / total) * 100));
      return { subscription, daysLeft: left, totalDays: total, usedDays: used, progressPercent: percent, loading };
    }

    // fallback
    const fallbackTotal = 30;
    const fallbackLeft = 15;
    const fallbackUsed = fallbackTotal - fallbackLeft;
    const fallbackPercent = Math.min(100, Math.round((fallbackUsed / fallbackTotal) * 100));
    return { subscription: null, daysLeft: fallbackLeft, totalDays: fallbackTotal, usedDays: fallbackUsed, progressPercent: fallbackPercent, loading };
  }, [subscription, loading]);

  return result;
}
