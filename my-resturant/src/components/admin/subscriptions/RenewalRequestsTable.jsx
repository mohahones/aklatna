import { formatDate } from "../../../utils/dateUtils";

export default function RenewalRequestsTable({ requests, onApprove, onReject }) {
  return (
    <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
      <div className="border-b border-border-subtle bg-surface-container px-4 py-4">
        <h2 className="text-lg font-semibold text-on-surface">طلبات تجديد الاشتراك</h2>
        <p className="text-sm text-on-surface-variant">
          الطلبات التي تم إرسالها من صفحة تجديد الاشتراك في انتظار المراجعة.
        </p>
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
            {requests.length > 0 ? (
              requests.map((request, index) => (
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
                        onClick={() => onApprove(request)}
                        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        تجديد الاشتراك
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(request)}
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
  );
}
