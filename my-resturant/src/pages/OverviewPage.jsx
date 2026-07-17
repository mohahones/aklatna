import { useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import SalesChart from "../components/dashboard/SalesChart";
import RecentOrders from "../components/dashboard/RecentOrders";
import DayDetailsModal from "../components/dashboard/DayDetailsModal";
import RenewSubscriptionButton from "../components/dashboard/RenewSubscriptionButton";
import useSubscription, { SUBSCRIPTION_PERIOD_DAYS } from "../hooks/useSubscription";

export default function OverviewPage() {
  const [chartRange, setChartRange] = useState(7);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");

  const { daysLeft, progressPercent, loading: subLoading } = useSubscription();

  const handleBarClick = (day) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const stats = [
    { title: "طلبات اليوم", value: "42", icon: "shopping_bag", iconClass: "bg-secondary-container" },
    { title: "إيرادات اليوم", value: "$1,240", icon: "payments", iconClass: "bg-secondary-container" },
    { title: "طلبات قيد التنفيذ", value: "8", icon: "pending_actions", iconClass: "bg-tertiary-container/10" },
    { title: "حالة الاشتراك", value: "-", icon: "verified", iconClass: "bg-primary-fixed" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
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
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesChart range={chartRange} setRange={setChartRange} onBarClick={handleBarClick} />
        <RecentOrders />
      </div>

      <section className="pb-10">
        <div className="h-48 bg-surface-container-lowest border border-border-subtle rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer transition-transform hover:scale-[1.005]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-right">
            <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full w-max mb-3">ملف المطبخ</span>
            <h4 className="text-white text-xl font-bold">حدّث صور متجرك</h4>
            <p className="text-white/80 text-sm">حافظ على جاذبية ملفك الشخصي لعملائك.</p>
          </div>
        </div>
      </section>

      <DayDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dayName={selectedDay} />
    </div>
  );
}
