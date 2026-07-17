export default function StatCard({ title, value, icon, iconClass, children }) {
  const hasFooter = Boolean(children);

  return (
    <div
      className={`bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm text-right ${
        hasFooter ? "p-6 flex flex-col" : "p-5"
      }`}
    >
      <div className={`flex items-center gap-4 ${hasFooter ? "mb-4" : ""}`}>
        <div className={`p-2.5 rounded-lg shrink-0 ${iconClass}`}>
          <span className="material-symbols-outlined text-primary text-[22px]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-secondary text-xs mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-on-surface leading-tight">{value}</h3>
        </div>
      </div>
      {hasFooter && <div className="mt-auto space-y-2">{children}</div>}
    </div>
  );
}
