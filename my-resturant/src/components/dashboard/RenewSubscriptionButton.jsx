import { useState } from "react";
import useRenewSubscription from "../../hooks/useRenewSubscription";
import RenewSubscriptionConfirmModal from "./RenewSubscriptionConfirmModal";

export default function RenewSubscriptionButton({ className = "" }) {
  const { isSubmitting, hasRequested, message, isChecking, sendRenewRequest } = useRenewSubscription();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canSendRequest = !isChecking && !isSubmitting && !hasRequested;

  const buttonLabel = hasRequested
    ? "تم إرسال طلب التجديد"
    : isChecking
      ? "جاري التحقق..."
      : isSubmitting
        ? "جاري الإرسال..."
        : "تجديد الاشتراك";

  function openRequestModal() {
    if (!canSendRequest) return;
    setIsModalOpen(true);
  }

  async function handleConfirm() {
    const success = await sendRenewRequest();
    if (success) setIsModalOpen(false);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={openRequestModal}
        disabled={!canSendRequest}
        className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary/50"
      >
        {buttonLabel}
      </button>
      {message && <p className="mt-2 text-[10px] leading-relaxed text-secondary">{message}</p>}

      <RenewSubscriptionConfirmModal
        isOpen={isModalOpen && canSendRequest}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
