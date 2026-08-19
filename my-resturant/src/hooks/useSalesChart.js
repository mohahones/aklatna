import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

/**
 * Hook لجلب بيانات الرسم البياني للمبيعات من قاعدة البيانات
 * يجلب إحصائيات آخر 7 أيام أو آخر 30 يوم
 */
export default function useSalesChart(range = 7) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    async function loadSalesData() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setError("Supabase غير مهيأة");
          setIsLoading(false);
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
            setIsLoading(false);
          }
          return;
        }

        // حساب التاريخ الابتدائي
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (range - 1));

        // جلب البيانات من جدول daily_sales_stats
        const { data, error: fetchError } = await supabase
          .from("daily_sales_stats")
          .select("*")
          .eq("business_id", businessId)
          .gte("sales_date", startDate.toISOString().split("T")[0])
          .lte("sales_date", endDate.toISOString().split("T")[0])
          .order("sales_date", { ascending: false });

        if (fetchError) {
          console.error("Error loading sales data:", fetchError);
          if (isMounted) {
            setError("فشل تحميل بيانات المبيعات");
            setChartData([]);
          }
          return;
        }

        if (!isMounted) return;

        // تحويل البيانات إلى صيغة الرسم البياني
        const formattedData = formatSalesData(data, range);
        setChartData(formattedData);
        setError(null);

        // الاستماع للتحديثات الفورية
        channel = supabase
          .channel(`sales-live-${businessId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "daily_sales_stats",
              filter: `business_id=eq.${businessId}`,
            },
            (payload) => {
              if (isMounted) {
                const updatedData = payload.new || payload.old;
                setChartData((current) => {
                  const updated = [...current];
                  const index = updated.findIndex(
                    (item) => item.date === updatedData.sales_date
                  );
                  if (index !== -1) {
                    updated[index] = {
                      ...updated[index],
                      val: Number(updatedData.total_revenue || 0),
                      orders: updatedData.total_orders,
                      completed: updatedData.completed_orders,
                      cancelled: updatedData.cancelled_orders,
                      avgValue: Number(updatedData.average_order_value || 0),
                    };
                  }
                  return updated;
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Exception loading sales data:", err);
        if (isMounted) {
          setError("حدث خطأ أثناء تحميل البيانات");
          setChartData([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSalesData();

    return () => {
      isMounted = false;
      if (channel) channel.unsubscribe();
    };
  }, [range]);

  return { chartData, isLoading, error };
}

/**
 * تنسيق بيانات المبيعات لعرضها في الرسم البياني
 */
function formatSalesData(data, range) {
  if (!Array.isArray(data) || data.length === 0) {
    return generateEmptyData(range);
  }

  // إنشاء خريطة من التاريخ إلى البيانات
  const dataMap = new Map();
  data.forEach((item) => {
    dataMap.set(item.sales_date, item);
  });

  // توليد جميع الأيام في النطاق
  const result = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (range - 1));

  for (let i = range - 1; i >= 0; i--) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (range - 1 - i));
    const dateStr = date.toISOString().split("T")[0];
    const dayData = dataMap.get(dateStr);

    if (range === 7) {
      result.push({
        day: getDayName(date),
        date: dateStr,
        val: dayData ? Number(dayData.total_revenue || 0) : 0,
        orders: dayData ? dayData.total_orders : 0,
        completed: dayData ? dayData.completed_orders : 0,
        cancelled: dayData ? dayData.cancelled_orders : 0,
        avgValue: dayData ? Number(dayData.average_order_value || 0) : 0,
      });
    } else {
      result.push({
        day: null,
        date: dateStr,
        val: dayData ? Number(dayData.total_revenue || 0) : 0,
        orders: dayData ? dayData.total_orders : 0,
        completed: dayData ? dayData.completed_orders : 0,
        cancelled: dayData ? dayData.cancelled_orders : 0,
        avgValue: dayData ? Number(dayData.average_order_value || 0) : 0,
      });
    }
  }

  return result;
}

/**
 * توليد بيانات فارغة للأيام بدون طلبات
 */
function generateEmptyData(range) {
  const result = [];
  const endDate = new Date();

  for (let i = range - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    if (range === 7) {
      result.push({
        day: getDayName(date),
        date: dateStr,
        val: 0,
        orders: 0,
        completed: 0,
        cancelled: 0,
        avgValue: 0,
      });
    } else {
      result.push({
        day: null,
        date: dateStr,
        val: 0,
        orders: 0,
        completed: 0,
        cancelled: 0,
        avgValue: 0,
      });
    }
  }

  return result;
}

/**
 * الحصول على اسم اليوم بالعربية
 */
function getDayName(date) {
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return days[date.getDay()];
}
