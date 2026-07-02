import { useEffect, useMemo, useState } from "react";
import { useCashPayment } from "../hooks/useCashPayment";
import { SidebarSection } from "../components/CashPayment/SidebarSection";
import { FilterSection } from "../components/CashPayment/FilterSection";
import { StatisticCard } from "../components/CashPayment/StatisticCard";
import { RequestsTable } from "../components/CashPayment/RequestsTable";
import { ToastNotification } from "../components/CashPayment/ToastNotification";
import { isSameDay } from "../utils/cashPaymentUtils";

export default function CashPaymentPage({ onLogout }) {
  // Hooks
  const { requests, handleApprove, handleReject } = useCashPayment();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(["pending", "accepted", "rejected"]);
  const [timeRange, setTimeRange] = useState("الكل");
  const [toast, setToast] = useState(null);

  // Effects - Toast timer
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Computed values
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

  // Handlers
  function toggleStatus(status) {
    setSelectedStatuses((current) => {
      if (current.includes(status)) {
        return current.filter((item) => item !== status);
      }
      return [...current, status];
    });
  }

  async function handleAction(id, action) {
    const target = requests.find((request) => request.id === id);

    if (action === "approve") {
      const error = await handleApprove(id);
      if (!error) {
        setToast({
          type: "success",
          title: "تمت الموافقة بنجاح",
          message: `تم تفعيل خطة مطعم ${target?.restaurantName || "المطعم"} وتحديث حالة الدفع.`,
        });
      }
    } else if (action === "reject") {
      const error = await handleReject(id);
      if (!error) {
        setToast({
          type: "error",
          title: "تم رفض الطلب",
          message: `تم إرسال إشعار لمطعم ${target?.restaurantName || "المطعم"} لمراجعة الإدارة.`,
        });
      }
    }
  }

  console.log("البيانات النهائية (Filtered):", filteredRequests);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Mobile Header with Hamburger */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-4 bg-white/95 px-4 py-4 backdrop-blur lg:hidden border-b border-border-subtle">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex flex-col gap-1.5 p-2 hover:bg-surface-container rounded-lg transition"
        >
          <span className={`h-0.5 w-6 bg-on-surface transition-all ${sidebarOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`h-0.5 w-6 bg-on-surface transition-all ${sidebarOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-on-surface transition-all ${sidebarOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
        <h1 className="text-lg font-bold text-on-surface">إدارة طلبات الدفع النقدي</h1>
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        {/* Sidebar - Desktop always visible, Mobile slides in */}
        <div
          className={`fixed inset-y-0 right-0 z-30 w-full sm:w-80 lg:relative lg:z-auto lg:w-auto lg:translate-x-0 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <SidebarSection
            onLogout={() => {
              setSidebarOpen(false);
              onLogout();
            }}
          />
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 pt-20 sm:px-6 lg:pt-6 lg:px-8">
          <div className="space-y-6">
            {/* Header - Desktop only */}
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

            {/* Statistics */}
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

            {/* Requests Table */}
            <RequestsTable
              filteredRequests={filteredRequests}
              onApprove={(id) => handleAction(id, "approve")}
              onReject={(id) => handleAction(id, "reject")}
            />
          </div>

          {/* Toast */}
          <ToastNotification toast={toast} />
        </main>
      </div>
    </div>
  );
}
