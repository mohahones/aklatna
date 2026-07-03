import MaterialIcon from "../ui/MaterialIcon";

export function StatisticCard({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
        <MaterialIcon name={icon} className="text-3xl" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{label}</p>
        <p className="font-display-lg text-display-lg">{value}</p>
      </div>
    </div>
  );
}
