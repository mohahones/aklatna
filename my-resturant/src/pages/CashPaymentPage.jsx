import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient";
import { SidebarSection } from "../components/CashPayment/SidebarSection";
import { FilterSection } from "../components/CashPayment/FilterSection";
import { StatisticCard } from "../components/CashPayment/StatisticCard";
import { RequestsTable } from "../components/CashPayment/RequestsTable";
import { DailyStatsSection } from "../components/CashPayment/DailyStatsSection";
import { ToastNotification } from "../components/CashPayment/ToastNotification";
import { isSameDay } from "../utils/cashPaymentUtils";

export default function CashPaymentPage({ onLogout }) {
  // State
  const [requests, setRequests] = useState([]);
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

  // Load signup requests and realtime listener
  useEffect(() => {
    let mounted = true;

    async function loadSignupRequests() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('subscription_requests')
          .select('*, business:businesses(name, name_ar, phone)')
          .eq('status', 'pending')
          .eq('request_type', 'SIGNUP')
          .order('created_at', { ascending: false });

        if (!mounted) return;
        if (error) {
          console.error('Error loading signup requests:', error);
          setRequests([]);
        } else {
          const formatted = (data || []).map((item) => {
            const biz = item.business || item.businesses || null;
            const createdAt = item.created_at || item.createdAt || null;
            const date = createdAt
              ? new Date(createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'غير محدد';
            const time = createdAt
              ? new Date(createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
              : '';

            return {
              ...item,
              businesses: biz,
              restaurantName: biz?.name_ar || biz?.name || 'غير معروف',
              amount: item.amount ?? item.businesses?.amount ?? 0,
              createdAt,
              date,
              time,
            };
          });
          setRequests(formatted);
        }
      } catch (err) {
        console.error('Exception loading signup requests:', err);
        setRequests([]);
      }
    }

    loadSignupRequests();

    const channel = isSupabaseConfigured && supabase
      ? supabase
          .channel('subscription-requests-signup')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'subscription_requests' },
            async (payload) => {
              const eventType = payload?.eventType || payload?.type;

              // INSERT: fetch the full row with aliased business relation to normalize shape
              if (payload?.new && eventType === 'INSERT') {
                const n = payload.new;
                if (n.request_type === 'SIGNUP' && n.status === 'pending') {
                  try {
                    const { data: row, error: fetchErr } = await supabase
                      .from('subscription_requests')
                      .select('*, business:businesses(name, name_ar, phone)')
                      .eq('id', n.id)
                      .single();

                    if (fetchErr) {
                      console.error('Error fetching inserted request row:', fetchErr);
                      return;
                    }

                    const biz = row.business || row.businesses || null;
                    const createdAt = row.created_at || row.createdAt || null;
                    const date = createdAt
                      ? new Date(createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'غير محدد';
                    const time = createdAt
                      ? new Date(createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    const formatted = {
                      ...row,
                      businesses: biz,
                      restaurantName: biz?.name_ar || biz?.name || 'غير معروف',
                      createdAt,
                      date,
                      time,
                    };
                    setRequests((cur) => [formatted, ...cur]);
                  } catch (err) {
                    console.error('Exception fetching inserted row:', err);
                  }
                }
              }

              // UPDATE: remove approved/rejected from pending list
              if (payload?.new && eventType === 'UPDATE') {
                const newRow = payload.new;
                if (newRow.status === 'approved' || newRow.status === 'rejected') {
                  setRequests((cur) => cur.filter((r) => r.id !== newRow.id));
                }
              }

              // DELETE: remove deleted row
              if (payload?.old && eventType === 'DELETE') {
                setRequests((cur) => cur.filter((r) => r.id !== payload.old.id));
              }
            }
          )
          .subscribe()
      : null;

    return () => {
      mounted = false;
      if (channel) channel.unsubscribe();
    };
  }, []);

  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const collectedToday = requests
    .filter((request) => {
      const requestDate = request.createdAt ? new Date(request.createdAt) : null;
      return request.status === "accepted" && requestDate && isSameDay(requestDate, new Date());
    })
    .reduce((sum, request) => sum + request.amount, 0);

  // Daily Stats
  const dailyStats = useMemo(() => {
    const statsMap = new Map();

    requests.forEach((request) => {
      const dateStr = request.createdAt 
        ? new Date(request.createdAt).toLocaleDateString("ar-SA", { 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })
        : "غير محدد";

      if (!statsMap.has(dateStr)) {
        statsMap.set(dateStr, {
          date: dateStr,
          collected: 0,
          accepted: 0,
          rejected: 0,
        });
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

    if (action === 'approve') {
      // Approve signup: activate business and mark request approved
      try {
        const businessId = target?.business_id || target?.businesses?.id;
        if (!businessId) throw new Error('Business id missing');

        const now = new Date().toISOString();
        const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const { error: err1 } = await supabase
          .from('businesses')
          .update({ is_active: true, created_at: now, expires_at: newExpiresAt })
          .eq('id', businessId);

        if (err1) throw err1;

        const { error: err2 } = await supabase
          .from('subscription_requests')
          .update({ status: 'approved' })
          .eq('id', id);

        if (err2) throw err2;

        setRequests((cur) => cur.filter((r) => r.id !== id));

        setToast({
          type: 'success',
          title: 'تمت الموافقة بنجاح',
          message: `تم تفعيل خطة مطعم ${target?.businesses?.name || 'المطعم'} وتحديث الحالة.`,
        });
      } catch (err) {
        console.error('Approve error:', err);
        setToast({ type: 'error', title: 'خطأ', message: 'فشل اعتماد الطلب. حاول لاحقاً.' });
      }
    } else if (action === 'reject') {
      try {
        const { error } = await supabase
          .from('subscription_requests')
          .update({ status: 'rejected' })
          .eq('id', id);

        if (error) throw error;

        setRequests((cur) => cur.filter((r) => r.id !== id));

        setToast({ type: 'error', title: 'تم رفض الطلب', message: `تم رفض طلب ${target?.businesses?.name || 'المطعم'}.` });
      } catch (err) {
        console.error('Reject error:', err);
        setToast({ type: 'error', title: 'خطأ', message: 'فشل رفض الطلب. حاول لاحقاً.' });
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

            {/* Daily Stats */}
            <DailyStatsSection dailyStats={dailyStats} />
          </div>

          {/* Toast */}
          <ToastNotification toast={toast} />
        </main>
      </div>
    </div>
  );
}
