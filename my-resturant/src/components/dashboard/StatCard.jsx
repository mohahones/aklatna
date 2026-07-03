// StatCard is simple JSX; no React import needed with automatic JSX runtime

export default function StatCard({ title, value, icon, iconClass, children }) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm text-right relative">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${iconClass}`}>
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
      </div>
      <p className="text-secondary text-xs mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-on-surface">{value}</h3>
      {children}
    </div>
  );
}
