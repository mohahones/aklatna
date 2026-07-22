export default function KanbanColumn({ title, status, count, color, children, isHidden }) {
  return (
    <div dir="rtl" className={`flex flex-col flex-shrink-0 h-full bg-surface-container-low/50 rounded-xl border border-border-subtle overflow-hidden min-w-[280px] max-w-[320px] transition-all duration-300 ${isHidden ? "hidden" : "block"}`}>
      <div className="p-4 border-b border-border-subtle bg-surface-container-lowest flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${color}`}></span>
          <h3 className="text-sm font-bold">{title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${status === "new" ? "bg-primary-fixed text-on-primary-fixed" : status === "ready" ? "bg-tertiary-fixed text-on-tertiary-fixed" : status === "delivered" ? "bg-surface-container-highest text-secondary" : "bg-secondary-fixed text-on-secondary-fixed"}`}>
          {count} {status === "delivered" ? "اليوم" : ""}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">{children}</div>
    </div>
  );
}
