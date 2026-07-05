import { useEffect, useMemo, useState } from "react";
import { SidebarSection } from "../components/CashPayment/SidebarSection";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

function getRemainingTime(expiresAt, now) {
  if (!expiresAt) {
    return { label: "غير محدد", isExpired: false, milliseconds: Number.POSITIVE_INFINITY };
  }

  const expiresTime = new Date(expiresAt).getTime();
  const remainingMs = expiresTime - now.getTime();

  if (remainingMs <= 0) {
    const sinceMs = now.getTime() - expiresTime;
    const days = Math.floor(sinceMs / 86400000);
    const hours = Math.floor((sinceMs % 86400000) / 3600000);
    const minutes = Math.floor((sinceMs % 3600000) / 60000);

    const parts = [];
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (days === 0 && hours === 0 && minutes === 0) parts.push("أقل من دقيقة");
    else if (minutes > 0) parts.push(`${minutes} دقيقة`);

    return { label: `انتهى منذ ${parts.join(" ")}`, isExpired: true, milliseconds: remainingMs };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} يوم`);
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  if (days === 0 && hours === 0 && minutes === 0) parts.push(`${seconds} ثانية`);

  return { label: `متبقي ${parts.join(" ")}`, isExpired: false, milliseconds: remainingMs };
}

function formatDate(value) {
  if (!value) return "غير محدد";
  return new Date(value).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SubscriptionsPage({ onLogout }) {
  const [subscribers, setSubscribers] = useState([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: "" });
  const [confirmRenew, setConfirmRenew] = useState({ open: false, requestId: null, businessId: null, name: "", currentExpiresAt: null });
  const [confirmRejectRenew, setConfirmRejectRenew] = useState({ open: false, requestId: null, name: "" });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadSubscriptionRequests() {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data, error } = await supabase
          .from("subscription_requests")
          .select("*, businesses(name, name_ar, phone, is_active, expires_at)")
          .eq("status", "pending")
          .eq("request_type", "RENEWAL")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading subscription requests:", error);
          setSubscriptionRequests([]);
        } else {
          const formatted = (data || []).map((item) => {
            const createdAt = item.created_at || null;
            return {
              ...item,
              businesses: item.businesses || null,
              date: createdAt
                ? new Date(createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
                : "غير محدد",
              time: createdAt
                ? new Date(createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
                : "",
            };
          });
          setSubscriptionRequests(formatted);
        }
      } catch (err) {
        console.error("Exception loading subscription requests:", err);
        setSubscriptionRequests([]);
      }
    }

    loadSubscriptionRequests();

    const reqChannel = isSupabaseConfigured && supabase
      ? supabase
          .channel("subscription-requests")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "subscription_requests" },
            async (payload) => {
              const eventType = payload?.eventType || payload?.type || payload?.event;
              const newRow = payload?.new;
              const oldRow = payload?.old;

              if (eventType === "INSERT" && newRow?.request_type === "RENEWAL" && newRow?.status === "pending") {
                const createdAt = newRow.created_at || null;
                const formatted = {
                  ...newRow,
                  businesses: newRow.businesses || null,
                  date: createdAt
                    ? new Date(createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
                    : "غير محدد",
                  time: createdAt
                    ? new Date(createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
                    : "",
                };
                setSubscriptionRequests((current) => [formatted, ...current]);
                return;
              }

              if (eventType === "UPDATE" && (newRow?.status === "approved" || newRow?.status === "rejected")) {
                setSubscriptionRequests((current) => current.filter((request) => request.id !== newRow.id));
                return;
              }

              if (eventType === "DELETE" && oldRow) {
                setSubscriptionRequests((current) => current.filter((request) => request.id !== oldRow.id));
                return;
              }
            }
          )
          .subscribe()
      : null;

    return () => {
      if (reqChannel) reqChannel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadSubscribers() {
      if (!isSupabaseConfigured || !supabase) {
        setError("Supabase غير مهيأة");
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase
          .from("businesses")
          .select("id, name_ar, phone, expires_at, created_at, is_active, renewal_requested_at")
          .eq("is_active", true)
          .not("created_at", "is", null)
          .order("created_at", { ascending: false });

        let { data, error } = await query;

        if (error && /renewal_requested_at/.test(error.message || "")) {
          const fallbackQuery = supabase
            .from("businesses")
            .select("id, name_ar, phone, expires_at, created_at, is_active")
            .eq("is_active", true)
            .not("created_at", "is", null)
            .order("created_at", { ascending: false });
          const fallbackResult = await fallbackQuery;
          data = fallbackResult.data;
          error = fallbackResult.error;
        }

        if (error) {
          console.error("Error loading subscribers:", error);
          setError("فشل تحميل بيانات المشتركين");
          setSubscribers([]);
        } else {
          setSubscribers(data || []);
          setError(null);
        }
      } catch (err) {
        console.error("Exception loading subscribers:", err);
        setError("حدث خطأ أثناء تحميل المشتركين");
        setSubscribers([]);
      }

      setIsLoading(false);
    }

    loadSubscribers();

    const channel = isSupabaseConfigured && supabase
      ? supabase
          .channel("subscribers-status")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "businesses" },
            () => loadSubscribers()
          )
          .subscribe()
      : null;

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  const enhancedSubscribers = useMemo(
    () =>
      subscribers.map((subscriber) => {
        const remaining = getRemainingTime(subscriber.expires_at, now);
        const isExpiringSoon = !remaining.isExpired && remaining.milliseconds <= 5 * 86400000;
        return {
          ...subscriber,
          remaining: { ...remaining, isExpiringSoon },
          createdAtLabel: formatDate(subscriber.created_at),
          expiresAtLabel: formatDate(subscriber.expires_at),
        };
      }),
    [subscribers, now]
  );

  const activeCount = enhancedSubscribers.length;
  const expiringSoonCount = enhancedSubscribers.filter(
    (subscriber) => !subscriber.remaining.isExpired && subscriber.remaining.milliseconds <= 7 * 86400000
  ).length;
  // Use the `subscription_requests` table for pending renewals (joined with `businesses`)
  const expiringRenewalRequests = subscriptionRequests || [];
  const expiredSubscribers = enhancedSubscribers.filter((subscriber) => subscriber.remaining.isExpired);
  const expiredCount = expiredSubscribers.length;

  // Approve renewal request (call RPC and optimistic update)
  async function handleApproveRenewal(requestId, businessId, currentExpiresAt = null) {
    if (!isSupabaseConfigured || !supabase) return;
    if (!requestId || !businessId) return new Error("Missing request or business id");

    try {
      let expiresAt = currentExpiresAt;
      if (!expiresAt) {
        const { data: business, error: bizErr } = await supabase
          .from("businesses")
          .select("expires_at")
          .eq("id", businessId)
          .single();

        if (bizErr) {
          console.error("Error fetching business expiry:", bizErr);
          return bizErr;
        }

        expiresAt = business?.expires_at || null;
      }

      const now = new Date();
      let newExpiresAt;
      if (expiresAt) {
        const currentExpires = new Date(expiresAt);
        if (currentExpires.getTime() > now.getTime()) {
          newExpiresAt = new Date(currentExpires);
          newExpiresAt.setDate(newExpiresAt.getDate() + 30);
        } else {
          newExpiresAt = new Date(now);
          newExpiresAt.setDate(newExpiresAt.getDate() + 30);
        }
      } else {
        newExpiresAt = new Date(now);
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);
      }

      const { error: updateErr } = await supabase
        .from("businesses")
        .update({ is_active: true, expires_at: newExpiresAt.toISOString() })
        .eq("id", businessId);

      if (updateErr) {
        console.error("Error updating business expiry:", updateErr);
        return updateErr;
      }

      const { error: reqErr } = await supabase
        .from("subscription_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (reqErr) {
        console.error("Error approving renewal request:", reqErr);
        return reqErr;
      }

      setSubscriptionRequests((cur) => cur.filter((r) => r.id !== requestId));
      return null;
    } catch (err) {
      console.error("Exception approving renewal:", err);
      return err;
    }
  }

  function openRenewConfirm(request) {
    setConfirmRenew({
      open: true,
      requestId: request.id,
      businessId: request.businesses?.id || request.business_id || null,
      name: request.businesses?.name || request.businesses?.name_ar || request.business_name || "الاشتراك",
      currentExpiresAt: request.businesses?.expires_at || request.expires_at || null,
    });
  }

  function closeRenewConfirm() {
    setConfirmRenew({ open: false, requestId: null, businessId: null, name: "" });
  }

  async function confirmRenewal() {
    if (!confirmRenew.requestId || !confirmRenew.businessId) return;

    const error = await handleApproveRenewal(
      confirmRenew.requestId,
      confirmRenew.businessId,
      confirmRenew.currentExpiresAt
    );
    if (!error) closeRenewConfirm();
  }

  async function handleRejectRenewal(requestId) {
    if (!isSupabaseConfigured || !supabase || !requestId) return new Error("Missing request id");

    try {
      const { error } = await supabase
        .from("subscription_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) {
        console.error("Error rejecting renewal request:", error);
        return error;
      }

      setSubscriptionRequests((current) => current.filter((request) => request.id !== requestId));
      return null;
    } catch (err) {
      console.error("Exception rejecting renewal:", err);
      return err;
    }
  }

  function openRejectConfirm(request) {
    setConfirmRejectRenew({
      open: true,
      requestId: request.id,
      name: request.businesses?.name || request.businesses?.name_ar || request.business_name || "الاشتراك",
    });
  }

  function closeRejectConfirm() {
    setConfirmRejectRenew({ open: false, requestId: null, name: "" });
  }

  async function confirmRejection() {
    if (!confirmRejectRenew.requestId) return;

    const error = await handleRejectRenewal(confirmRejectRenew.requestId);
    if (!error) closeRejectConfirm();
  }

  function openDeleteConfirm(subscriber) {
    setConfirmDelete({
      open: true,
      id: subscriber.id,
      name: subscriber.name_ar || subscriber.name || "الحساب",
    });
  }

  function closeDeleteConfirm() {
    setConfirmDelete({ open: false, id: null, name: "" });
  }

  async function handleDeleteSubscriber() {
    if (!isSupabaseConfigured || !supabase || !confirmDelete.id) return;

    try {
      const { error } = await supabase.rpc("admin_reject_and_delete_business", {
        p_business_id: confirmDelete.id,
      });

      if (error) {
        console.error("Error deleting subscriber:", error);
        setError("فشل حذف الحساب. حاول مرة أخرى.");
        return;
      }

      setSubscribers((current) => current.filter((subscriber) => subscriber.id !== confirmDelete.id));
      closeDeleteConfirm();
    } catch (err) {
      console.error("Exception deleting subscriber:", err);
      setError("فشل حذف الحساب. حاول مرة أخرى.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <div className={`fixed inset-y-0 right-0 z-30 w-full sm:w-80 lg:relative lg:z-auto lg:w-auto lg:translate-x-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
          <SidebarSection onLogout={() => onLogout()} />
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 px-4 py-6 pt-8 sm:px-6 lg:pt-6 lg:px-8">
          <div className="lg:hidden mb-4 flex items-center justify-between rounded-2xl border border-border-subtle bg-white/95 p-4 shadow-sm">
            <h1 className="text-lg font-semibold text-on-surface">عرض المشتركين</h1>
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-white text-on-surface shadow-sm transition hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={sidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {sidebarOpen ? (
                  <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <>
                    <path d="M5 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M5 17H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </div>
          <header className="mb-6 rounded-2xl border border-border-subtle bg-white/90 p-6 shadow-sm">
            <h1 className="font-headline-md text-headline-md">عرض المشتركين</h1>
            <p className="mt-1 text-sm text-on-surface-variant">المشتركين الذين تمت الموافقة عليهم وكم تبقى لهم من الاشتراك.</p>
          </header>

          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
              <p className="text-sm text-on-surface-variant">المشتركين النشطين</p>
              <p className="mt-3 text-3xl font-semibold text-success-green">{activeCount}</p>
            </div>
            <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
              <p className="text-sm text-on-surface-variant">قريب الانتهاء</p>
              <p className="mt-3 text-3xl font-semibold text-pending-amber">{expiringSoonCount}</p>
            </div>
            <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
              <p className="text-sm text-on-surface-variant">المنتهية</p>
              <p className="mt-3 text-3xl font-semibold text-error-red">{expiredCount}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-border-subtle bg-white/90 p-10 text-center text-sm text-on-surface-variant">
              جاري تحميل بيانات المشتركين...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-error-red/20 bg-error-red/10 p-8 text-center text-sm text-error-red">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-on-surface">قائمة المشتركين</h2>
                <p className="mt-1 text-sm text-on-surface-variant">معلومات عن كل مشترك ووقت انتهاء الاشتراك.</p>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full border-collapse text-right text-sm">
                    <thead className="bg-surface-container text-on-surface-variant">
                      <tr>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">اسم المطعم</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">الهاتف</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">سجل منذ</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">ينتهي في</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedSubscribers.length > 0 ? (
                        enhancedSubscribers.map((subscriber, index) => (
                          <tr key={subscriber.id} className={index % 2 === 0 ? "bg-white" : "bg-surface-container"}>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p className="font-semibold">{subscriber.name_ar || "غير معروف"}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p>{subscriber.phone || "-"}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p>{subscriber.createdAtLabel}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p>{subscriber.expiresAtLabel}</p>
                              <p className="text-xs text-on-surface-variant">{subscriber.remaining.label}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${subscriber.remaining.isExpired ? "bg-error-red/10 text-error-red" : subscriber.remaining.isExpiringSoon ? "bg-pending-amber/10 text-pending-amber" : "bg-success-green/10 text-success-green"}`}>
                                {subscriber.remaining.isExpired ? "منتهي" : "نشط"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="bg-white">
                          <td colSpan="5" className="px-4 py-8 text-center text-sm text-on-surface-variant">
                            لا يوجد مشتركين لعرضهم حالياً.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
                <div className="border-b border-border-subtle bg-surface-container px-4 py-4">
                  <h2 className="text-lg font-semibold text-on-surface">طلبات تجديد الاشتراك</h2>
                  <p className="text-sm text-on-surface-variant">الطلبات التي تم إرسالها من صفحة تجديد الاشتراك في انتظار المراجعة.</p>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full border-collapse text-right text-sm">
                    <thead className="bg-surface-container text-on-surface-variant">
                      <tr>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">اسم المطعم</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">الهاتف</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">تم الطلب في</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringRenewalRequests.length > 0 ? (
                        expiringRenewalRequests.map((request, index) => (
                          <tr key={request.id} className={index % 2 === 0 ? "bg-white" : "bg-surface-container"}>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p className="font-semibold">{request.businesses?.name || "غير معروف"}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p>{request.businesses?.phone || "-"}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p>{formatDate(request.created_at)}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openRenewConfirm(request)}
                                  className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90"
                                >
                                  تجديد الاشتراك
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openRejectConfirm(request)}
                                  className="rounded-full border border-error-red/30 bg-error-red/10 px-3 py-1 text-xs font-semibold text-error-red transition hover:bg-error-red/20"
                                >
                                  رفض التجديد
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="bg-white">
                          <td colSpan="4" className="px-4 py-8 text-center text-sm text-on-surface-variant">
                            لا توجد طلبات تجديد حالياً.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
                <div className="border-b border-border-subtle bg-surface-container px-4 py-4">
                  <h2 className="text-lg font-semibold text-on-surface">الاشتراكات المنتهية</h2>
                  <p className="text-sm text-on-surface-variant">المشتركين الذين انتهت صلاحية اشتراكهم ويمكن حذف حساباتهم.</p>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full border-collapse text-right text-sm">
                    <thead className="bg-surface-container text-on-surface-variant">
                      <tr>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">اسم المطعم</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">الهاتف</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">انتهى منذ</th>
                        <th className="border-b border-border-subtle px-4 py-3 font-semibold">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredSubscribers.length > 0 ? (
                        expiredSubscribers.map((subscriber, index) => (
                          <tr key={subscriber.id} className={index % 2 === 0 ? "bg-white" : "bg-surface-container"}>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p className="font-semibold">{subscriber.name_ar || "غير معروف"}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p>{subscriber.phone || "-"}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <p className="text-base font-semibold text-error-red">{subscriber.remaining.label}</p>
                            </td>
                            <td className="border-b border-border-subtle px-4 py-4 align-top">
                              <button
                                type="button"
                                onClick={() => openDeleteConfirm(subscriber)}
                                className="rounded-2xl bg-error-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-error-red/90"
                              >
                                حذف الحساب
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="bg-white">
                          <td colSpan="4" className="px-4 py-8 text-center text-sm text-on-surface-variant">
                            لا توجد اشتراكات منتهية حالياً.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {confirmDelete.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={closeDeleteConfirm} />
              <div className="relative z-10 w-full max-w-md rounded-[26px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_120px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-transform duration-300 ease-out transform opacity-100 scale-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-red/10 text-error-red">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">تأكيد حذف الحساب</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">هل أنت متأكد من حذف {confirmDelete.name}؟ لن تتمكن من استرجاعه.</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDeleteConfirm}
                    className="rounded-2xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSubscriber}
                    className="rounded-2xl bg-error-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-error-red/90"
                  >
                    حذف نهائي
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmRenew.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={closeRenewConfirm} />
              <div className="relative z-10 w-full max-w-md rounded-[26px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_120px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-transform duration-300 ease-out transform opacity-100 scale-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">تأكيد تجديد الاشتراك</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">هل تريد تجديد اشتراك {confirmRenew.name} الآن؟ سيتم تحديث تاريخ التجديد لمدة 30 يومًا.</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRenewConfirm}
                    className="rounded-2xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={confirmRenewal}
                    className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                  >
                    تأكيد التجديد
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmRejectRenew.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={closeRejectConfirm} />
              <div className="relative z-10 w-full max-w-md rounded-[26px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_120px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-transform duration-300 ease-out transform opacity-100 scale-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-red/10 text-error-red">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">تأكيد رفض التجديد</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      هل تريد رفض طلب تجديد اشتراك {confirmRejectRenew.name}؟ سيتمكن المطعم من إرسال طلب جديد لاحقاً.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRejectConfirm}
                    className="rounded-2xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={confirmRejection}
                    className="rounded-2xl bg-error-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-error-red/90"
                  >
                    تأكيد الرفض
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
