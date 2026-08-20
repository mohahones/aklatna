import MaterialIcon from "../../ui/MaterialIcon";

export default function SubscriptionStats({ activeCount, expiringSoonCount, expiredCount }) {
  const stats = [
    { label: "المشتركين النشطين", value: activeCount, icon: "verified", color: "bg-secondary-container text-on-secondary-container" },
    { label: "قريب الانتهاء", value: expiringSoonCount, icon: "schedule", color: "bg-primary-fixed text-primary" },
    { label: "الاشتراكات المنتهية", value: expiredCount, icon: "event_busy", color: "bg-error-container text-error" },
  ];

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface-container-lowest p-5 text-right shadow-sm">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
            <MaterialIcon name={stat.icon} className="text-2xl" filled />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-on-surface">{stat.value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
