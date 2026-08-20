export default function SubscribersTable({ subscribers }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface-container-lowest shadow-sm">
      <div className="border-b border-border-subtle px-6 py-5 text-right">
        <h2 className="text-lg font-bold text-on-surface">قائمة المشتركين</h2>
        <p className="mt-1 text-sm text-secondary">معلومات عن كل مشترك ووقت انتهاء الاشتراك.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-right text-sm">
          <thead className="bg-surface-container-low text-secondary">
            <tr>
              <th className="border-b border-border-subtle px-4 py-3 font-semibold">اسم المطعم</th>
              <th className="border-b border-border-subtle px-4 py-3 font-semibold">الهاتف</th>
              <th className="border-b border-border-subtle px-4 py-3 font-semibold">سجل منذ</th>
              <th className="border-b border-border-subtle px-4 py-3 font-semibold">ينتهي في</th>
              <th className="border-b border-border-subtle px-4 py-3 font-semibold">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length > 0 ? (
              subscribers.map((subscriber, index) => (
                <tr key={subscriber.id} className="transition-colors hover:bg-surface-container-low">
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
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        subscriber.remaining.isExpired
                          ? "bg-error-red/10 text-error-red"
                          : subscriber.remaining.isExpiringSoon
                            ? "bg-pending-amber/10 text-pending-amber"
                            : "bg-success-green/10 text-success-green"
                      }`}
                    >
                      {subscriber.remaining.isExpired ? "منتهي" : "نشط"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="bg-surface-container-lowest">
                <td colSpan="5" className="px-4 py-8 text-center text-sm text-on-surface-variant">
                  لا يوجد مشتركين لعرضهم حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
