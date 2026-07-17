export default function ExpiredSubscribersTable({ subscribers, onDelete }) {
  return (
    <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
      <div className="border-b border-border-subtle bg-surface-container px-4 py-4">
        <h2 className="text-lg font-semibold text-on-surface">الاشتراكات المنتهية</h2>
        <p className="text-sm text-on-surface-variant">
          المشتركين الذين انتهت صلاحية اشتراكهم ويمكن حذف حساباتهم.
        </p>
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
            {subscribers.length > 0 ? (
              subscribers.map((subscriber, index) => (
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
                      onClick={() => onDelete(subscriber)}
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
  );
}
