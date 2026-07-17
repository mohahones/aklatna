import { useState } from "react";
import MaterialIcon from "../ui/MaterialIcon";
import { STATUS_META } from "../../utils/cashPaymentUtils";

export function RequestsTable({ filteredRequests, onApprove, onReject }) {
  const [confirm, setConfirm] = useState({ open: false, id: null, action: null });

  function openConfirm(id, action, restaurantName) {
    setConfirm({ open: true, id, action, restaurantName });
  }

  async function handleConfirm() {
    if (!confirm.id || !confirm.action) return;
    const { id, action } = confirm;
    setConfirm((c) => ({ ...c, processing: true }));
    try {
      if (action === "approve") {
        await onApprove(id);
      } else if (action === "reject") {
        await onReject(id);
      }
    } finally {
      setConfirm({ open: false, id: null, action: null });
    }
  }

  function closeConfirm() {
    setConfirm({ open: false, id: null, action: null });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface-container-low/30 px-4 py-4">
        <h2 className="font-title-md text-title-md">الطلبات المعلقة</h2>
        <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant">
          إجمالي: {filteredRequests.length} طلب
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-right">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">
                اسم المطعم
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">
                تاريخ الطلب
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">
                المبلغ المستحق
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">
                الحالة
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:px-5">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredRequests.map((request) => {
              const meta = STATUS_META[request.status] || STATUS_META.pending;
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
                  <td className="px-4 py-4 text-sm font-semibold sm:px-5">$10.00</td>
                  <td className="px-4 py-4 sm:px-5">
                    <div className={`flex items-center gap-1.5 ${meta.tone}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      <span className="text-xs font-bold">{meta.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-5">
                    {request.status === "pending" ? (
                      <div className="flex gap-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openConfirm(request.id, "approve", request.restaurantName)}
                            className="rounded-lg bg-success-green px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                          >
                            موافقة
                          </button>
                          <button
                            type="button"
                            onClick={() => openConfirm(request.id, "reject", request.restaurantName)}
                            className="rounded-lg border border-error-red px-3 py-1.5 text-xs font-bold text-error-red transition hover:bg-error-red/5"
                          >
                            رفض
                          </button>
                        </div>
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

      {/* Confirmation Modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={closeConfirm} />
          <div className="relative z-10 w-full max-w-md rounded-[26px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_120px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-transform duration-300 ease-out transform opacity-100 scale-100">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${confirm.action === "approve" ? "bg-success-green/10 text-success-green" : "bg-error-red/10 text-error-red"}`}>
                {confirm.action === "approve" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface">تأكيد الإجراء</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  هل أنت متأكد أنك تريد {confirm.action === "approve" ? "قبول" : "رفض"} طلب مطعم {confirm.restaurantName || "هذا"}؟
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-2xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${confirm.action === "approve" ? "bg-success-green hover:bg-success-green/90" : "bg-error-red hover:bg-error-red/90"}`}
              >
                {confirm.action === "approve" ? "نعم، قبول" : "نعم، رفض"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
