import { useState } from "react";
import MaterialIcon from "../ui/MaterialIcon";
import { STATUS_META } from "../../utils/cashPaymentUtils";

export function RequestsTable({ filteredRequests, onApprove, onReject }) {
  const [confirm, setConfirm] = useState({ open: false, id: null, action: null });

  function openConfirm(id, action) {
    setConfirm({ open: true, id, action });
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
              const meta = STATUS_META[request.status];
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
                  <td className="px-4 py-4 text-sm font-semibold sm:px-5">${request.amount}.00</td>
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
                            onClick={() => openConfirm(request.id, "approve")}
                            className="rounded-lg bg-success-green px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                          >
                            موافقة
                          </button>
                          <button
                            type="button"
                            onClick={() => openConfirm(request.id, "reject")}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">تأكيد الإجراء</h3>
            <p className="mb-4 text-sm text-on-surface-variant">
              هل أنت متأكد أنك تريد {confirm.action === "approve" ? "قبول" : "رفض"} هذا الطلب؟
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-surface-container-high"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${confirm.action === "approve" ? "bg-success-green text-white" : "bg-error-red text-white"}`}
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
