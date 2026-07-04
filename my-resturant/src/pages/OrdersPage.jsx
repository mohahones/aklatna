import { useEffect, useRef, useState } from "react";

const INITIAL_ORDERS = [
  { id: "#ORD-8825", customer: "يوسف الحسن", items: 2, total: 25.0, time: "دقيقة واحدة", status: "new" },
  { id: "#ORD-8821", customer: "سارة جنكينز", items: 3, total: 42.5, time: "دقيقتين", status: "new" },
  { id: "#ORD-8812", customer: "مارك طومسون", items: 2, total: 31.0, time: "22 دقيقة", status: "ready" },
  { id: "#ORD-8815", customer: "إيلينا جوميز", items: 5, total: 84.2, time: "15 دقيقة", status: "ready" },
  { id: "#ORD-8819", customer: "روبرت تشن", items: 1, total: 18.9, time: "8 دقائق", status: "ready" },
  { id: "#ORD-8808", customer: "أميليا ريد", items: 4, total: 56.75, time: "35 دقيقة", status: "ready" },
  { id: "#ORD-8795", customer: "ليندا رايت", items: 2, total: 28.4, time: "11:42 صباحاً", status: "delivered" },
];

function OrderCard({ order, onAccept, onReady, onSend }) {
  const isNew = order.status === "new";
  const isPreparing = order.status === "preparing";
  const isReady = order.status === "ready";
  const isDelivered = order.status === "delivered";

  return (
    <div
      className={`bg-surface-container-lowest p-4 rounded-xl border shadow-sm hover:shadow-md transition-all ${
        isNew ? "border-primary/30 shadow-[0_0_12px_rgba(174,50,0,0.1)]" : "border-border-subtle"
      } ${isReady ? "border-r-4 border-r-tertiary" : ""} ${isPreparing ? "border-r-4 border-r-pending-amber" : ""} ${isDelivered ? "grayscale-[0.5] opacity-80" : ""}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-bold ${isNew ? "text-primary" : "text-secondary"}`}>{order.id}</span>
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
          <button onClick={() => onAccept(order)} className="text-primary font-bold text-xs hover:underline">قبول</button>
        )}
        {isPreparing && (
          <button onClick={() => onReady(order.id)} className="bg-primary text-on-primary px-3 py-1 rounded-lg text-xs font-bold hover:opacity-90 transition-all">جاهز</button>
        )}
        {isReady && (
          <button onClick={() => onSend(order.id)} className="bg-tertiary text-white px-3 py-1 rounded-lg text-xs font-bold hover:opacity-90">إرسال</button>
        )}
        {isDelivered && (
          <button className="text-secondary font-bold text-xs hover:text-on-surface transition-colors">التفاصيل</button>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ title, status, count, color, children, isHidden }) {
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

export default function OrdersPage() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [isFilterReady, setIsFilterReady] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    // material icons are used; no external init required
  }, [orders, isFilterReady, selectedOrder]);

  const handleAcceptClick = (order) => setSelectedOrder(order);

  const confirmAcceptance = () => {
    if (!selectedOrder) return;
    setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: "preparing", time: "أقل من دقيقة" } : o)));
    setSelectedOrder(null);
  };

  const handleReadyMove = (orderId) => setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "ready" } : o)));

  const handleSendOrder = (orderId) => setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "delivered", time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) } : o)));

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) setSelectedOrder(null);
  };

  const counts = {
    new: orders.filter((o) => o.status === "new").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="p-8 min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">إدارة الطلبات</h2>
          <p className="text-secondary text-sm">عرض مباشر لعمليات المطبخ وحالة التسليم.</p>
        </div>
        <button
          onClick={() => setIsFilterReady(!isFilterReady)}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold shadow-md transition-all ${isFilterReady ? "bg-tertiary text-white" : "bg-primary text-on-primary hover:shadow-lg"}`}
        >
          <span className="material-symbols-outlined">check_circle</span>
          {isFilterReady ? "إظهار الكل" : "جاهز"}
        </button>
      </div>

      <div dir="ltr" className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar items-start h-[calc(100vh-280px)] w-full">
        <KanbanColumn title="تم التسليم" status="delivered" count={counts.delivered} color="bg-success-green" isHidden={isFilterReady}>
          {orders.filter((o) => o.status === "delivered").map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </KanbanColumn>

        <KanbanColumn title="جاهز" status="ready" count={counts.ready} color="bg-tertiary">
          {orders.filter((o) => o.status === "ready").map((order) => (
            <OrderCard key={order.id} order={order} onSend={handleSendOrder} />
          ))}
        </KanbanColumn>

        <KanbanColumn title="قيد التحضير" status="preparing" count={counts.preparing} color="bg-pending-amber" isHidden={isFilterReady}>
          {orders.filter((o) => o.status === "preparing").map((order) => (
            <OrderCard key={order.id} order={order} onReady={handleReadyMove} />
          ))}
        </KanbanColumn>

        <KanbanColumn title="طلبات جديدة" status="new" count={counts.new} color="bg-primary" isHidden={isFilterReady}>
          {orders.filter((o) => o.status === "new").map((order) => (
            <OrderCard key={order.id} order={order} onAccept={handleAcceptClick} />
          ))}
        </KanbanColumn>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={handleBackdropClick}>
          <div ref={modalRef} className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-border-subtle animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">
                تفاصيل الطلب <span className="text-primary">{selectedOrder.id}</span>
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <h4 className="text-[10px] text-secondary uppercase font-bold mb-2">معلومات العميل</h4>
                <p className="text-base font-bold">{selectedOrder.customer}</p>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-xs text-secondary flex items-center gap-2">
                    <span className="material-symbols-outlined">phone</span> +966 50 123 4567
                  </p>
                  <p className="text-xs text-secondary flex items-center gap-2">
                    <span className="material-symbols-outlined">place</span> حي النرجس، الرياض
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] text-secondary uppercase font-bold">الأصناف</h4>
                  <span className="text-[10px] bg-surface-container-low px-2 py-0.5 rounded">{selectedOrder.items} أصناف</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex justify-between text-sm">
                    <span className="text-on-surface">برجر دجاج <span className="text-secondary">x2</span></span>
                    <span className="font-bold text-on-surface">$30.00</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-on-surface">بطاطا مقلية <span className="text-secondary">x1</span></span>
                    <span className="font-bold text-on-surface">$3.50</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] text-secondary uppercase font-bold mb-2">تفاصيل الطلب / ملاحظات المطبخ</h4>
                <textarea placeholder="أضف ملاحظات خاصة للمطبخ هنا..." className="w-full rounded-lg border-border-subtle bg-surface-container-low text-sm p-3 focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]"></textarea>
              </div>

              <div className="pt-4 border-t border-border-subtle space-y-2">
                <div className="flex justify-between text-xs text-secondary">
                  <span>المجموع الفرعي</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-secondary">
                  <span>الضريبة (15%)</span>
                  <span>${(selectedOrder.total * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-primary pt-2">
                  <span>الإجمالي</span>
                  <span>${(selectedOrder.total * 1.15).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-surface-container-low flex gap-3">
              <button onClick={confirmAcceptance} className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-bold hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all">تأكيد وقبول الطلب</button>
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-3 border border-border-subtle bg-surface-container-lowest rounded-lg text-secondary font-bold hover:bg-surface-container-low transition-colors text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
