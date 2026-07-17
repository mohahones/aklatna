import { useEffect, useState, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";

export const SUBSCRIPTION_PERIOD_DAYS = 30;

function diffDaysFromNow(targetDate) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / msPerDay));
}

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
        let resolvedBusinessId = businessId;

        if (!resolvedBusinessId) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          resolvedBusinessId = session?.user?.id ?? null;
        }

        if (!resolvedBusinessId) {
          if (mounted) setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("businesses")
          .select("created_at, expires_at")
          .eq("id", resolvedBusinessId)
          .maybeSingle();

        if (error) console.warn("Failed to load subscription:", error);
        if (mounted) setSubscription(data ?? null);
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
    if (subscription?.expires_at) {
      const daysLeft = diffDaysFromNow(subscription.expires_at);
      const usedDays = Math.min(
        SUBSCRIPTION_PERIOD_DAYS,
        Math.max(0, SUBSCRIPTION_PERIOD_DAYS - daysLeft)
      );
      const progressPercent = Math.min(
        100,
        Math.round((usedDays / SUBSCRIPTION_PERIOD_DAYS) * 100)
      );

      return {
        subscription,
        daysLeft,
        totalDays: SUBSCRIPTION_PERIOD_DAYS,
        usedDays,
        progressPercent,
        loading,
      };
    }

    return {
      subscription: null,
      daysLeft: 0,
      totalDays: SUBSCRIPTION_PERIOD_DAYS,
      usedDays: SUBSCRIPTION_PERIOD_DAYS,
      progressPercent: 100,
      loading,
    };
  }, [subscription, loading]);

  return result;
}
