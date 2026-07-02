import MaterialIcon from "../ui/MaterialIcon";

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
      <div className="space-y-3">
        {dailyStats.map((stat) => (
          <div key={stat.date} className="rounded-lg border border-border-subtle bg-surface-container p-4 hover:shadow-sm transition">
            <p className="mb-3 text-sm font-medium text-on-surface-variant">{stat.date}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-success-green/10 p-3">
                <MaterialIcon name="check_circle" className="text-lg text-success-green" filled />
                <div>
                  <p className="text-xs text-on-surface-variant">مقبول</p>
                  <p className="font-bold text-success-green">{stat.accepted}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-red-600/10 p-3">
                <MaterialIcon name="cancel" className="text-lg text-red-600" filled />
                <div>
                  <p className="text-xs text-on-surface-variant">مرفوض</p>
                  <p className="font-bold text-red-600">{stat.rejected}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-blue-600/10 p-3">
                <MaterialIcon name="payments" className="text-lg text-blue-600" filled />
                <div>
                  <p className="text-xs text-on-surface-variant">المحصل</p>
                  <p className="font-bold text-blue-600">${stat.collected.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
