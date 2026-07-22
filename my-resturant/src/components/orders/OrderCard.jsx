export default function OrderCard({ order, onAccept, onReady, onSend, onShowDetails }) {
  const isNew = order.status === "new";
  const isPreparing = order.status === "preparing";
  const isReady = order.status === "ready";
  const isDelivered = order.status === "delivered";

  return (
    <div
      onClick={() => onShowDetails?.(order)}
      className={`cursor-pointer bg-surface-container-lowest p-4 rounded-xl border shadow-sm hover:shadow-md transition-all ${
        isNew ? "border-primary/30 shadow-[0_0_12px_rgba(174,50,0,0.1)]" : "border-border-subtle"
      } ${isReady ? "border-r-4 border-r-tertiary" : ""} ${isPreparing ? "border-r-4 border-r-pending-amber" : ""} ${isDelivered ? "grayscale-[0.5] opacity-80" : ""}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-bold ${isNew ? "text-primary" : "text-secondary"}`}>{order.displayId || order.id}</span>
        {isNew && <span className="bg-primary-container text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">جديد</span>}
        {isDelivered && <span className="text-success-green material-symbols-outlined">check_circle</span>}
      </div>
      <h4 className={`font-bold mb-1 ${isDelivered ? "text-secondary" : "text-on-surface"}`}>{order.customer}</h4>
      <div className="flex items-center gap-2 text-secondary text-xs mb-4">
        <span className="material-symbols-outlined">shopping_bag</span>
        {order.items} {order.items === 1 ? "صنف" : "أصناف"}
        <span className="mx-1">•</span>
        <span className="text-on-surface font-bold">${order.total.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <span className="text-secondary text-[11px] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">schedule</span> {isDelivered ? `اكتمل في ${order.time}` : `منذ ${order.time}`}
        </span>

        {isNew && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onAccept(order);
            }}
            className="text-primary font-bold text-xs hover:underline"
          >
            قبول
          </button>
        )}
        {isPreparing && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onReady(order.id);
            }}
            className="bg-primary text-on-primary px-3 py-1 rounded-lg text-xs font-bold hover:opacity-90 transition-all"
          >
            جاهز
          </button>
        )}
        {isReady && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onSend(order.id);
            }}
            className="bg-tertiary text-white px-3 py-1 rounded-lg text-xs font-bold hover:opacity-90"
          >
            إرسال
          </button>
        )}
        {isDelivered && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onShowDetails?.(order);
            }}
            className="text-secondary font-bold text-xs hover:text-on-surface transition-colors"
          >
            التفاصيل
          </button>
        )}
      </div>
    </div>
  );
}
