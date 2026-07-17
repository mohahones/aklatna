import { useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import ConfirmModal from "../components/ui/ConfirmModal";
import SubscriptionStats from "../components/admin/subscriptions/SubscriptionStats";
import SubscribersTable from "../components/admin/subscriptions/SubscribersTable";
import RenewalRequestsTable from "../components/admin/subscriptions/RenewalRequestsTable";
import ExpiredSubscribersTable from "../components/admin/subscriptions/ExpiredSubscribersTable";
import useLiveClock from "../hooks/useLiveClock";
import useAdminSubscribers from "../hooks/admin/useAdminSubscribers";
import useRenewalRequests from "../hooks/admin/useRenewalRequests";
import { useEnhancedSubscribers } from "../hooks/admin/useEnhancedSubscribers";
import {
  approveRenewalRequest,
  rejectRenewalRequest,
  deleteExpiredSubscriber,
} from "../services/admin/renewalActions";

export default function SubscriptionsPage({ onLogout }) {
  const now = useLiveClock();
  const { subscribers, isLoading, error, setError, removeSubscriber } = useAdminSubscribers();
  const { requests: renewalRequests, removeRequest } = useRenewalRequests();

  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: "" });
  const [confirmRenew, setConfirmRenew] = useState({
    open: false,
    requestId: null,
    businessId: null,
    name: "",
    currentExpiresAt: null,
  });
  const [confirmRejectRenew, setConfirmRejectRenew] = useState({ open: false, requestId: null, name: "" });

  const enhancedSubscribers = useEnhancedSubscribers(subscribers, now);

  const stats = useMemo(() => {
    const activeCount = enhancedSubscribers.length;
    const expiringSoonCount = enhancedSubscribers.filter(
      (subscriber) => !subscriber.remaining.isExpired && subscriber.remaining.milliseconds <= 7 * 86400000
    ).length;
    const expiredSubscribers = enhancedSubscribers.filter((subscriber) => subscriber.remaining.isExpired);

    return {
      activeCount,
      expiringSoonCount,
      expiredCount: expiredSubscribers.length,
      expiredSubscribers,
    };
  }, [enhancedSubscribers]);

  function openRenewConfirm(request) {
    setConfirmRenew({
      open: true,
      requestId: request.id,
      businessId: request.businesses?.id || request.business_id || null,
      name: request.businesses?.name || request.businesses?.name_ar || request.business_name || "الاشتراك",
      currentExpiresAt: request.businesses?.expires_at || request.expires_at || null,
    });
  }

  function openRejectConfirm(request) {
    setConfirmRejectRenew({
      open: true,
      requestId: request.id,
      name: request.businesses?.name || request.businesses?.name_ar || request.business_name || "الاشتراك",
    });
  }

  function openDeleteConfirm(subscriber) {
    setConfirmDelete({
      open: true,
      id: subscriber.id,
      name: subscriber.name_ar || subscriber.name || "الحساب",
    });
  }

  async function confirmRenewal() {
    if (!confirmRenew.requestId || !confirmRenew.businessId) return;

    const err = await approveRenewalRequest(
      confirmRenew.requestId,
      confirmRenew.businessId,
      confirmRenew.currentExpiresAt
    );

    if (!err) {
      removeRequest(confirmRenew.requestId);
      setConfirmRenew({ open: false, requestId: null, businessId: null, name: "", currentExpiresAt: null });
    }
  }

  async function confirmRejection() {
    if (!confirmRejectRenew.requestId) return;

    const err = await rejectRenewalRequest(confirmRejectRenew.requestId);
    if (!err) {
      removeRequest(confirmRejectRenew.requestId);
      setConfirmRejectRenew({ open: false, requestId: null, name: "" });
    }
  }

  async function handleDeleteSubscriber() {
    if (!confirmDelete.id) return;

    const err = await deleteExpiredSubscriber(confirmDelete.id);
    if (err) {
      setError("فشل حذف الحساب. حاول مرة أخرى.");
      return;
    }

    removeSubscriber(confirmDelete.id);
    setConfirmDelete({ open: false, id: null, name: "" });
  }

  return (
    <AdminLayout title="عرض المشتركين" onLogout={onLogout}>
      <header className="mb-6 rounded-2xl border border-border-subtle bg-white/90 p-6 shadow-sm">
        <h1 className="font-headline-md text-headline-md">عرض المشتركين</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          المشتركين الذين تمت الموافقة عليهم وكم تبقى لهم من الاشتراك.
        </p>
      </header>

      <SubscriptionStats
        activeCount={stats.activeCount}
        expiringSoonCount={stats.expiringSoonCount}
        expiredCount={stats.expiredCount}
      />

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
          <SubscribersTable subscribers={enhancedSubscribers} />
          <RenewalRequestsTable
            requests={renewalRequests}
            onApprove={openRenewConfirm}
            onReject={openRejectConfirm}
          />
          <ExpiredSubscribersTable subscribers={stats.expiredSubscribers} onDelete={openDeleteConfirm} />
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.open}
        title="تأكيد حذف الحساب"
        description={`هل أنت متأكد من حذف ${confirmDelete.name}؟ لن تتمكن من استرجاعه.`}
        confirmLabel="حذف نهائي"
        onConfirm={handleDeleteSubscriber}
        onClose={() => setConfirmDelete({ open: false, id: null, name: "" })}
        icon="close"
        iconClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-red/10 text-error-red"
        confirmClassName="rounded-2xl bg-error-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-error-red/90"
      />

      <ConfirmModal
        isOpen={confirmRenew.open}
        title="تأكيد تجديد الاشتراك"
        description={`هل تريد تجديد اشتراك ${confirmRenew.name} الآن؟ سيتم تحديث تاريخ التجديد لمدة 30 يومًا.`}
        confirmLabel="تأكيد التجديد"
        onConfirm={confirmRenewal}
        onClose={() =>
          setConfirmRenew({ open: false, requestId: null, businessId: null, name: "", currentExpiresAt: null })
        }
      />

      <ConfirmModal
        isOpen={confirmRejectRenew.open}
        title="تأكيد رفض التجديد"
        description={`هل تريد رفض طلب تجديد اشتراك ${confirmRejectRenew.name}؟ سيتمكن المطعم من إرسال طلب جديد لاحقاً.`}
        confirmLabel="تأكيد الرفض"
        onConfirm={confirmRejection}
        onClose={() => setConfirmRejectRenew({ open: false, requestId: null, name: "" })}
        icon="close"
        iconClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-red/10 text-error-red"
        confirmClassName="rounded-2xl bg-error-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-error-red/90"
      />
    </AdminLayout>
  );
}
