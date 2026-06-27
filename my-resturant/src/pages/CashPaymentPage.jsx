import { useEffect, useMemo, useState } from "react";
import MaterialIcon from "../components/ui/MaterialIcon";
import { useRestaurantProfile } from "../hooks/useRestaurantProfile";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

const statusMeta = {
  pending: {
    label: "بانتظار التأكيد",
    tone: "text-pending-amber",
    dot: "bg-pending-amber",
  },
  accepted: {
    label: "مقبول",
    tone: "text-success-green",
    dot: "bg-success-green",
  },
  rejected: {
    label: "مرفوض",
    tone: "text-error-red",
    dot: "bg-error-red",
  },
};

export default function CashPaymentPage({ onLogout }) {
  const { restaurantName, isLoading } = useRestaurantProfile();
  const [requests, setRequests] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(["pending", "accepted", "rejected"]);
  const [timeRange, setTimeRange] = useState("الكل");
  const [toast, setToast] = useState(null);

  function mapBusinessRowToRequest(row) {
    return {
      id: row.id,
      restaurantName: row.name_ar || row.name || "مطعم غير مسجل",
      name: row.name || row.name_ar || "",
      phone: row.phone || "",
      address: row.address || "لا يوجد عنوان",
      isActive: Boolean(row.is_active),
      is_active: row.is_active,
      createdAt: row.created_at || null,
      created_at: row.created_at || null,
      date: row.created_at
        ? new Date(row.created_at).toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—",
      time: row.created_at
        ? new Date(row.created_at).toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      amount: 10,
      status: row.is_active ? "accepted" : "pending",
    };
  }

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function isSameDay(firstDate, secondDate) {
    if (!firstDate || !secondDate) {
      return false;
    }

    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );
  }

  useEffect(() => {
    let isMounted = true;
    let subscription;

   async function loadRequestsFromSupabase() {
      if (!isSupabaseConfigured || !supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*") // تأكد أنها نجمة لجلب كل شيء
        .order("created_at", { ascending: false });

      // ⬇️ 1. أضف هذا السطر هنا لفحص البيانات الخام القادمة من Supabase ⬇️
      console.log("1. البيانات الخام القادمة من السوبابيس مباشرة:", data, "الخطأ إن وجد:", error);

      if (!isMounted) return;

      if (!error && Array.isArray(data)) {
        const mappedData = data.map(mapBusinessRowToRequest);
        
        // ⬇️ 2. أضف هذا السطر هنا لفحص البيانات بعد تحويلها بدالة الـ Map ⬇️
        console.log("2. البيانات بعد دالة التحويل (Map):", mappedData);
        
        setRequests(mappedData);
      }
    }

    loadRequestsFromSupabase();

    if (isSupabaseConfigured && supabase) {
      subscription = supabase
        .channel("businesses-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "businesses" },
          (payload) => {
            if (!isMounted) {
              return;
            }

            setRequests((current) => [mapBusinessRowToRequest(payload.new), ...current]);
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (subscription) {
        supabase?.removeChannel(subscription);
      }
    };
  }, []);

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
    .filter((request) => request.status === "accepted")
    .reduce((sum, request) => sum + request.amount, 0);
  const visibleCount = filteredRequests.length;

  function toggleStatus(status) {
    setSelectedStatuses((current) => {
      if (current.includes(status)) {
        return current.filter((item) => item !== status);
      }
      return [...current, status];
    });
  }

  async function handleAction(id, action) {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const target = requests.find((request) => request.id === id);

    if (action === "approve") {
      const { error } = await supabase.from("businesses").update({ is_active: true }).eq("id", id);

      if (!error) {
        setRequests((current) =>
          current.map((request) => (request.id === id ? { ...request, status: "accepted", is_active: true } : request))
        );
      }
    } else if (action === "reject") {
      const { error } = await supabase.from("businesses").delete().eq("id", id);

      if (!error) {
        setRequests((current) => current.filter((request) => request.id !== id));
      }
    }

    setToast({
      type: action === "approve" ? "success" : "error",
      title: action === "approve" ? "تمت الموافقة بنجاح" : "تم رفض الطلب",
      message:
        action === "approve"
          ? `تم تفعيل خطة مطعم ${target?.restaurantName || "المطعم"} وتحديث حالة الدفع.`
          : `تم إرسال إشعار لمطعم ${target?.restaurantName || "المطعم"} لمراجعة الإدارة.`,
    });
  }
  console.log("3. البيانات النهائية التي يحاول الجدول عرضها فعلياً (Filtered):", filteredRequests);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="w-full bg-sidebar-bg px-6 py-8 text-sidebar-text lg:w-[260px] lg:shrink-0">
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <MaterialIcon name="payments" className="text-2xl text-white" filled />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-text">Admin Console</p>
              <p className="text-sm font-semibold text-white">{isLoading ? "جاري التحميل..." : restaurantName}</p>
            </div>
          </div>

          <nav className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg bg-primary-container px-4 py-3 text-sm font-medium text-white">
              <MaterialIcon name="payments" className="text-lg" filled />
              <span>Billing</span>
            </div>
          </nav>

          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-text transition hover:bg-white/10"
            >
              <MaterialIcon name="logout" className="text-lg" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Billing</p>
                <h1 className="font-headline-md text-headline-md text-on-surface">إدارة طلبات الدفع النقدي</h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                  مراجعة واعتماد عمليات الدفع اليدوية من شركاء المطاعم.
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
                  className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container"
                >
                  <MaterialIcon name="filter_list" className="text-base" />
                  تصفية النتائج
                </button>

                {showFilters && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border-subtle bg-white p-4 shadow-2xl">
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-xs font-semibold text-on-surface-variant">التاريخ</p>
                        <div className="flex gap-2">
                          {[
                            { label: "الكل", value: "الكل" },
                            { label: "آخر أسبوع", value: "آخر أسبوع" },
                            { label: "اليوم", value: "اليوم" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTimeRange(option.value)}
                              className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
                                timeRange === option.value
                                  ? "bg-primary text-white"
                                  : "bg-surface-container-low text-on-surface"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold text-on-surface-variant">الحالة</p>
                        <div className="space-y-2">
                          {[
                            { value: "pending", label: "بانتظار التأكيد" },
                            { value: "accepted", label: "مقبول" },
                            { value: "rejected", label: "مرفوض" },
                          ].map((status) => (
                            <label key={status.value} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedStatuses.includes(status.value)}
                                onChange={() => toggleStatus(status.value)}
                                className="rounded border-border-subtle text-primary focus:ring-primary"
                              />
                              <span>{status.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowFilters(false)}
                        className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white transition hover:opacity-90"
                      >
                        تطبيق الفلتر
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-white p-5 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MaterialIcon name="pending_actions" className="text-3xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">قيد الانتظار</p>
                  <p className="font-display-lg text-display-lg">{pendingCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-white p-5 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-green/10 text-success-green">
                  <MaterialIcon name="payments" className="text-3xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">تم التحصيل اليوم</p>
                  <p className="font-display-lg text-display-lg">{collectedToday}.00</p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border-subtle bg-surface-container-low/30 px-4 py-4">
                <h2 className="font-title-md text-title-md">الطلبات المعلقة</h2>
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant">
                  إجمالي: {visibleCount} طلب
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">اسم المطعم</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">تاريخ الطلب</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">المبلغ المستحق</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">الحالة</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredRequests.map((request) => {
                      const meta = statusMeta[request.status];
                      return (
                        <tr key={request.id} className="transition-colors duration-150 hover:bg-background">
                          <td className="px-4 py-4 sm:px-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-slate-100">
                                <MaterialIcon name="restaurant" className="text-sm text-slate-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{request.restaurantName}</p>
                                <p className="text-xs text-on-surface-variant">{request.address}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 sm:px-5">
                            <p className="text-sm">{request.date}</p>
                            <p className="text-xs text-on-surface-variant">{request.time}</p>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold sm:px-5">{request.amount}.00 ر.س</td>
                          <td className="px-4 py-4 sm:px-5">
                            <div className={`flex items-center gap-1.5 ${meta.tone}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                              <span className="text-xs font-bold">{meta.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 sm:px-5">
                            {request.status === "pending" ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAction(request.id, "approve")}
                                  className="rounded-lg bg-success-green px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                                >
                                  موافقة
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAction(request.id, "reject")}
                                  className="rounded-lg border border-error-red px-3 py-1.5 text-xs font-bold text-error-red transition hover:bg-error-red/5"
                                >
                                  رفض
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface-variant"
                              >
                                تمت المعالجة
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {toast && (
            <div className={`fixed bottom-8 left-8 z-[100] flex items-center gap-4 rounded-xl border border-white/10 px-6 py-4 shadow-2xl transition ${toast.type === "success" ? "bg-inverse-surface text-inverse-on-surface" : "bg-error-red text-white"}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${toast.type === "success" ? "bg-success-green/20" : "bg-white/20"}`}>
                <MaterialIcon name={toast.type === "success" ? "check_circle" : "cancel"} className={toast.type === "success" ? "text-success-green" : "text-white"} filled />
              </div>
              <div>
                <p className="text-sm font-bold">{toast.title}</p>
                <p className="text-xs opacity-80">{toast.message}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
