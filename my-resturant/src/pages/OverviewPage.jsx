import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import SalesChart from "../components/dashboard/SalesChart";
import RecentOrders from "../components/dashboard/RecentOrders";
import DayDetailsModal from "../components/dashboard/DayDetailsModal";
import RenewSubscriptionButton from "../components/dashboard/RenewSubscriptionButton";
import useSubscription, { SUBSCRIPTION_PERIOD_DAYS } from "../hooks/useSubscription";
import useBusinessAvatar from "../hooks/settings/useBusinessAvatar";
import useOrders from "../hooks/orders/useOrders";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

export default function OverviewPage() {
  const [chartRange, setChartRange] = useState(7);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedDayDate, setSelectedDayDate] = useState("");

  const { daysLeft, progressPercent, loading: subLoading } = useSubscription();
  const { coverUrl, rating } = useBusinessAvatar();
  const { orders, isLoading: ordersLoading } = useOrders();
  const [todayStats, setTodayStats] = useState(null);
  const [todayStatsLoading, setTodayStatsLoading] = useState(true);
  const [todayInProgressCount, setTodayInProgressCount] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let channel;

    async function loadTodayStats() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) setTodayStatsLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const businessId = session?.user?.id;
      if (!businessId) {
        if (isMounted) setTodayStatsLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_sales_stats")
        .select("total_orders, total_revenue")
        .eq("business_id", businessId)
        .eq("sales_date", today)
        .maybeSingle();

      const { data: todayOrdersData, error: todayOrdersError } = await supabase
        .from("order")
        .select("created_at, order_status")
        .eq("business_id", businessId);

      if (!todayOrdersError && Array.isArray(todayOrdersData) && isMounted) {
        const activeStatuses = ["new", "pending", "received", "queued", "preparing", "in_progress", "processing", "ready", "prepared"];
        setTodayInProgressCount(
          todayOrdersData.filter((order) => {
            const orderDate = new Date(order.created_at);
            const status = String(order.order_status || "").trim().toLowerCase();
            return orderDate.toISOString().split("T")[0] === today && activeStatuses.includes(status);
          }).length
        );
      }

      if (isMounted) {
        if (!error) setTodayStats(data || { total_orders: 0, total_revenue: 0 });
        setTodayStatsLoading(false);
      }

      channel = supabase
        .channel(`today-stats-${businessId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "daily_sales_stats", filter: `business_id=eq.${businessId}` },
          (payload) => {
            if (isMounted && payload.new?.sales_date === today) {
              setTodayStats(payload.new);
            }
          }
        )
        .subscribe();
    }

    loadTodayStats();

    return () => {
      isMounted = false;
      channel?.unsubscribe();
    };
  }, []);

  const todaySummary = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.time || order.created_at);
      return !Number.isNaN(orderDate.getTime()) && orderDate >= startOfDay && orderDate <= now && order.status !== "cancelled";
    });

    const todayRevenue = todayOrders.reduce((sum, order) => {
      if (order.status === "cancelled") return sum;
      const amount = Number(order.total || 0);
      return sum + amount;
    }, 0);

    const inProgressCount = orders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.time || order.created_at);
      const isToday = !Number.isNaN(orderDate.getTime()) && orderDate >= startOfDay && orderDate <= now;
      return isToday && ["new", "preparing", "ready"].includes(order.status);
    }).length;

    return {
      todayOrders: todayStats ? Number(todayStats.total_orders || 0) : todayOrders.length,
      todayRevenue: todayStats ? Number(todayStats.total_revenue || 0) : todayRevenue,
      inProgressCount: todayInProgressCount ?? inProgressCount,
    };
  }, [orders, todayStats, todayInProgressCount]);

  const handleBarClick = (date, day) => {
    setSelectedDay(day || "");
    setSelectedDayDate(date || "");
    setIsModalOpen(true);
  };

  const stats = [
    { title: "طلبات اليوم", value: ordersLoading || todayStatsLoading ? "..." : String(todaySummary.todayOrders), icon: "shopping_bag", iconClass: "bg-secondary-container", gridClass: "lg:col-start-1 lg:row-start-1" },
    { title: "إيرادات اليوم", value: ordersLoading || todayStatsLoading ? "..." : `${todaySummary.todayRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ل.س`, icon: "payments", iconClass: "bg-secondary-container", gridClass: "lg:col-start-2 lg:row-start-1" },
    { title: "طلبات قيد التنفيذ", value: ordersLoading && todayInProgressCount === null ? "..." : String(todaySummary.inProgressCount), icon: "pending_actions", iconClass: "bg-tertiary-container/10", gridClass: "lg:col-start-3 lg:row-start-1" },
    { title: "تقييم المطعم", value: rating != null ? String(Number(rating).toFixed(1)) : "-", icon: "star", iconClass: "bg-secondary-container", gridClass: "lg:col-start-1 lg:row-start-2" },
    { title: "حالة الاشتراك", value: "-", icon: "verified", iconClass: "bg-primary-fixed", gridClass: "lg:col-start-4 lg:row-start-1 lg:row-span-2" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {stats.map((stat, idx) => (
          <div key={idx} className={stat.gridClass ? stat.gridClass : ""}>
            <StatCard
              title={stat.title}
              value={stat.title === "حالة الاشتراك" ? (subLoading ? "..." : `${daysLeft} يوماً`) : stat.value}
              icon={stat.icon}
              iconClass={stat.iconClass}
            >
              {stat.title === "حالة الاشتراك" ? (
                <>
                  <div className="flex justify-between items-center text-[10px] font-medium text-secondary">
                    <span>ينتهي خلال {subLoading ? "..." : `${daysLeft} يوماً`}</span>
                    <span>{subLoading ? "..." : `${SUBSCRIPTION_PERIOD_DAYS} / ${daysLeft} يوم`}</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <RenewSubscriptionButton />
                </>
              ) : null}
            </StatCard>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesChart range={chartRange} setRange={setChartRange} onBarClick={handleBarClick} />
        <RecentOrders />
      </div>

      <section className="pb-10">
        <div
          className="h-48 bg-surface-container-lowest border border-border-subtle rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer transition-transform hover:scale-[1.005]"
          style={coverUrl ? { backgroundImage: `url('${coverUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-right">
            <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full w-max mb-3">ملف المطبخ</span>
            <h4 className="text-white text-xl font-bold">حدّث صور متجرك</h4>
            <p className="text-white/80 text-sm">حافظ على جاذبية ملفك الشخصي لعملائك.</p>
          </div>
        </div>
      </section>

      <DayDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dayName={selectedDay}
        dayDate={selectedDayDate}
      />
    </div>
  );
}
