import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

/**
 * Hook لجلب تفاصيل اليوم من المبيعات والأصناف الأكثر مبيعاً
 */
export default function useDayDetails(dayDate) {
  const [dayDetails, setDayDetails] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dayDate) return;

    let isMounted = true;

    async function loadDayDetails() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setError("Supabase غير مهيأة");
        }
        return;
      }

      try {
        setIsLoading(true);

        // جلب معرّف المطعم من الجلسة
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const businessId = session?.user?.id;
        if (!businessId) {
          if (isMounted) {
            setError("لم يتم العثور على معرّف المطعم");
          }
          return;
        }

        // تحويل dayDate إلى صيغة DATE
        const dateStr =
          typeof dayDate === "string"
            ? dayDate
            : dayDate.toISOString().split("T")[0];

        // جلب إحصائيات اليوم
        const { data: dayData, error: dayError } = await supabase
          .from("daily_sales_stats")
          .select("*")
          .eq("business_id", businessId)
          .eq("sales_date", dateStr)
          .maybeSingle();

        if (dayError) {
          console.error("Error loading day details:", dayError);
          if (isMounted) {
            setError("فشل تحميل تفاصيل اليوم");
            setDayDetails(null);
          }
          return;
        }

        // جلب الأصناف الأكثر مبيعاً في اليوم (أفضل 5)
        const { data: itemsData, error: itemsError } = await supabase
          .from("daily_top_items")
          .select("*")
          .eq("business_id", businessId)
          .eq("sales_date", dateStr)
          .order("quantity_sold", { ascending: false })
          .limit(5);

        if (itemsError) {
          console.error("Error loading top items:", itemsError);
          if (isMounted) {
            setError("فشل تحميل الأصناف الأكثر مبيعاً");
            setTopItems([]);
          }
          return;
        }

        if (!isMounted) return;

        setDayDetails(dayData);
        setTopItems(itemsData || []);
        setError(null);
      } catch (err) {
        console.error("Exception loading day details:", err);
        if (isMounted) {
          setError("حدث خطأ أثناء تحميل البيانات");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDayDetails();

    return () => {
      isMounted = false;
    };
  }, [dayDate]);

  return {
    dayDetails,
    topItems,
    isLoading,
    error,
    totalRevenue: dayDetails?.total_revenue || 0,
    totalOrders: dayDetails?.total_orders || 0,
    completedOrders: dayDetails?.completed_orders || 0,
    cancelledOrders: dayDetails?.cancelled_orders || 0,
    averageOrderValue: dayDetails?.average_order_value || 0,
  };
}
