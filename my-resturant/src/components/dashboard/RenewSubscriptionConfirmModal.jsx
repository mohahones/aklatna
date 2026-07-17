export default function RenewSubscriptionConfirmModal({ isOpen, onClose, onConfirm, isSubmitting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-md" onClick={isSubmitting ? undefined : onClose} />
      <div className="relative bg-surface-container-lowest w-full max-w-[420px] overflow-hidden rounded-xl shadow-2xl flex flex-col animate-slide-in">
        <div className="px-8 py-6 border-b border-border-subtle">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">verified</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">تأكيد تجديد الاشتراك</h2>
          </div>
          <p className="text-secondary font-body-md">
            هل تريد إرسال طلب تجديد الاشتراك إلى الإدارة؟ سيتم مراجعة طلبك وإبلاغك عند الموافقة.
          </p>
        </div>

        <div className="px-8 py-6 bg-surface-container-low flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg font-bold border border-border-subtle hover:bg-surface-container-high transition-all text-on-secondary-container disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-primary text-on-primary px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {isSubmitting ? "جاري الإرسال..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}
