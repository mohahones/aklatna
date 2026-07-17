export default function SubscriptionStats({ activeCount, expiringSoonCount, expiredCount }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 mb-6">
      <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-on-surface-variant">المشتركين النشطين</p>
        <p className="mt-3 text-3xl font-semibold text-success-green">{activeCount}</p>
      </div>
      <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-on-surface-variant">قريب الانتهاء</p>
        <p className="mt-3 text-3xl font-semibold text-pending-amber">{expiringSoonCount}</p>
      </div>
      <div className="rounded-3xl border border-border-subtle bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-on-surface-variant">المنتهية</p>
        <p className="mt-3 text-3xl font-semibold text-error-red">{expiredCount}</p>
      </div>
    </div>
  );
}
