import { useState } from "react";
import MaterialIcon from "../components/ui/MaterialIcon";
import RenewSubscriptionConfirmModal from "../components/dashboard/RenewSubscriptionConfirmModal";
import useRenewSubscription from "../hooks/useRenewSubscription";

export default function RenewSubscriptionPage({ onLogout }) {
  const { isSubmitting, hasRequested, message, isChecking, sendRenewRequest } = useRenewSubscription();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isBlocked = isChecking || isSubmitting || hasRequested;
  const canSendRequest = !isBlocked;

  const buttonLabel = hasRequested
    ? "تم إرسال طلب التجديد"
    : isChecking
      ? "جاري التحقق..."
      : isSubmitting
        ? "جاري الإرسال..."
        : "طلب تجديد الاشتراك";

  function openRequestModal() {
    if (!canSendRequest) return;
    setIsModalOpen(true);
  }

  async function handleConfirm() {
    const success = await sendRenewRequest();
    if (success) setIsModalOpen(false);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-bg px-4 py-8 text-on-surface antialiased sm:px-6 lg:px-8">
      <main className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col items-center justify-center">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
          <div className="absolute right-[-8%] top-[-8%] h-[36%] w-[36%] rounded-full bg-error-red blur-[140px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[36%] w-[36%] rounded-full bg-primary blur-[140px]" />
        </div>

        <div className="flex w-full justify-center px-2 sm:px-4 lg:px-6">
          <div className="relative w-full max-w-xl rounded-[28px] border border-error-red/10 bg-white/95 p-8 shadow-[0_24px_80px_-24px_rgba(174,50,0,0.28)] backdrop-blur-xl sm:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-error-red/10 animate-pulse">
                <MaterialIcon name="info" className="text-6xl text-error-red" />
              </div>

              <h1 className="mb-4 font-display-lg text-3xl text-on-surface">انتهى اشتراكك</h1>
              <p className="mb-4 max-w-md font-body-md text-body-md text-secondary">
                للاستخدام المستمر، يجب تجديد اشتراك مطعمك خلال 7 أيام حتى لا يتم حذف الحساب.
              </p>
              <div className="rounded-3xl border border-error-red/20 bg-error-red/10 px-4 py-3 text-sm text-error-red shadow-sm">
                <span className="font-semibold">تنبيه:</span> في حال لم يتم تجديد الاشتراك خلال 7 أيام، سيُغلق الحساب تلقائياً.
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={openRequestModal}
                disabled={!canSendRequest}
                className="w-full rounded-2xl bg-primary px-4 py-4 text-lg font-bold text-white shadow-sm shadow-primary/20 transition duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary/50 disabled:hover:translate-y-0"
              >
                {buttonLabel}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-2xl border-2 border-error-red px-4 py-4 text-lg font-bold text-error-red transition duration-200 hover:bg-error-red/10 active:scale-[0.98]"
              >
                تسجيل الخروج
              </button>
              {message && (
                <p className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-on-surface">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <RenewSubscriptionConfirmModal
        isOpen={isModalOpen && canSendRequest}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
