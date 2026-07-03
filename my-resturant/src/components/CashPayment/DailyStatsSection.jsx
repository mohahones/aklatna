export function DailyStatsSection({ dailyStats }) {
  if (dailyStats.length === 0) {
    return (
      <section className="rounded-2xl border border-border-subtle bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="mb-4 text-lg font-semibold text-on-surface">التحصيل اليومي</h2>
        <p className="text-center text-sm text-on-surface-variant py-8">لا توجد بيانات متاحة</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border-subtle bg-white/80 p-6 shadow-sm backdrop-blur">
      <h2 className="mb-6 text-lg font-semibold text-on-surface">التحصيل اليومي</h2>
      <div className="overflow-x-auto rounded-3xl border border-border-subtle bg-white/90">
        <table className="min-w-full border-collapse text-right text-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <th className="border-b border-border-subtle px-4 py-4 font-semibold">التاريخ</th>
              <th className="border-b border-border-subtle px-4 py-4 font-semibold">مقبول</th>
              <th className="border-b border-border-subtle px-4 py-4 font-semibold">مرفوض</th>
              <th className="border-b border-border-subtle px-4 py-4 font-semibold">المحصل</th>
            </tr>
          </thead>
          <tbody>
            {dailyStats.map((stat, index) => (
              <tr key={stat.date} className={index % 2 === 0 ? "bg-white" : "bg-surface-container"}>
                <td className="border-b border-border-subtle px-4 py-4 align-top">
                  <p className="font-semibold text-on-surface">{stat.date}</p>
                </td>
                <td className="border-b border-border-subtle px-4 py-4 align-top">
                  <p className="font-semibold text-success-green">{stat.accepted}</p>
                </td>
                <td className="border-b border-border-subtle px-4 py-4 align-top">
                  <p className="font-semibold text-error-red">{stat.rejected}</p>
                </td>
                <td className="border-b border-border-subtle px-4 py-4 align-top">
                  <p className="font-semibold text-blue-600">${stat.collected.toFixed(2)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
