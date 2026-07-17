import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { FilterSection } from "../components/CashPayment/FilterSection";
import { StatisticCard } from "../components/CashPayment/StatisticCard";
import { RequestsTable } from "../components/CashPayment/RequestsTable";
import { DailyStatsSection } from "../components/CashPayment/DailyStatsSection";
import { ToastNotification } from "../components/CashPayment/ToastNotification";
import { isSameDay } from "../utils/cashPaymentUtils";
import { useCashPayment } from "../hooks/admin/useCashPayment";

export default function CashPaymentPage({ onLogout }) {
  const { requests, loadError, handleApprove, handleReject } = useCashPayment();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(["pending", "accepted", "rejected"]);
  const [timeRange, setTimeRange] = useState("الكل");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredRequests = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    return requests.filter((request) => {
      const matchesStatus = selectedStatuses.includes(request.status);
      const requestDate = request.createdAt ? new Date(request.createdAt) : null;
      const matchesTime =
        timeRange === "الكل" ||
        (timeRange === "آخر أسبوع" && requestDate && requestDate >= weekAgo) ||
        (timeRange === "اليوم" && requestDate && isSameDay(requestDate, today));

      return matchesStatus && matchesTime;
    });
  }, [requests, selectedStatuses, timeRange]);

  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const collectedToday = requests
    .filter((request) => {
      const requestDate = request.createdAt ? new Date(request.createdAt) : null;
      return request.status === "accepted" && requestDate && isSameDay(requestDate, new Date());
    })
    .reduce((sum, request) => sum + request.amount, 0);

  const dailyStats = useMemo(() => {
    const statsMap = new Map();

    requests.forEach((request) => {
      const dateStr = request.createdAt
        ? new Date(request.createdAt).toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "غير محدد";

      if (!statsMap.has(dateStr)) {
        statsMap.set(dateStr, { date: dateStr, collected: 0, accepted: 0, rejected: 0 });
      }

      const stat = statsMap.get(dateStr);
      if (request.status === "accepted") {
        stat.collected += request.amount;
        stat.accepted += 1;
      } else if (request.status === "rejected") {
        stat.rejected += 1;
      }
    });

    return Array.from(statsMap.values()).reverse();
  }, [requests]);

  function toggleStatus(status) {
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status]
    );
  }

  async function handleAction(id, action) {
    const target = requests.find((request) => request.id === id);

    if (action === "approve") {
      const error = await handleApprove(id);
      if (error) {
      setToast({
        type: "error",
        title: "خطأ",
        message: error?.message || "فشل اعتماد الطلب. حاول لاحقاً.",
      });
      return;
      }
      setToast({
        type: "success",
        title: "تمت الموافقة بنجاح",
        message: `تم تفعيل خطة مطعم ${target?.businesses?.name || "المطعم"} وتحديث الحالة.`,
      });
      return;
    }

    const error = await handleReject(id);
    if (error) {
      setToast({ type: "error", title: "خطأ", message: "فشل رفض الطلب. حاول لاحقاً." });
      return;
    }
    setToast({
      type: "error",
      title: "تم رفض الطلب",
      message: `تم رفض طلب ${target?.businesses?.name || "المطعم"}.`,
    });
  }

  return (
    <AdminLayout title="إدارة طلبات الدفع النقدي" onLogout={onLogout}>
      <div className="space-y-6">
        <header className="hidden lg:flex flex-col gap-4 rounded-2xl border border-border-subtle bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">إدارة طلبات الدفع النقدي</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              مراجعة واعتماد عمليات الدفع اليدوية من شركاء المطاعم.
            </p>
          </div>

          <FilterSection
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((value) => !value)}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            selectedStatuses={selectedStatuses}
            onStatusToggle={toggleStatus}
          />
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatisticCard
            icon="pending_actions"
            label="قيد الانتظار"
            value={pendingCount}
            color="bg-primary/10 text-primary"
          />
          <StatisticCard
            icon="payments"
            label="تم التحصيل اليوم"
            value={`${collectedToday}.00`}
            color="bg-success-green/10 text-success-green"
          />
        </section>

        {loadError && (
          <div className="rounded-xl border border-error-red/30 bg-error-red/5 px-4 py-3 text-sm text-error-red">
            تعذر تحميل الطلبات: {loadError}
          </div>
        )}

        <RequestsTable
          filteredRequests={filteredRequests}
          onApprove={(id) => handleAction(id, "approve")}
          onReject={(id) => handleAction(id, "reject")}
        />

        <DailyStatsSection dailyStats={dailyStats} />
      </div>

      <ToastNotification toast={toast} />
    </AdminLayout>
  );
}
