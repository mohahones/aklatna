import { useState } from "react";
import useOrders from "../hooks/orders/useOrders";
import KanbanColumn from "../components/orders/KanbanColumn";
import OrderCard from "../components/orders/OrderCard";
import OrderDetailsModal from "../components/orders/OrderDetailsModal";

export default function OrdersPage() {
  const { orders, isLoading, error, updateOrderStatus, updateOrderEstimatedTime } = useOrders();
  const [isFilterReady, setIsFilterReady] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleShowDetails = (order) => setSelectedOrder(order);

  const confirmAcceptance = async (estimatedMinutes) => {
    if (!selectedOrder) return;
    if (selectedOrder.status !== "new") {
      setSelectedOrder(null);
      return;
    }

    const minutes = Number(estimatedMinutes);
    if (!Number.isNaN(minutes) && minutes > 0) {
      await updateOrderEstimatedTime(selectedOrder.id, minutes);
    }

    await updateOrderStatus(selectedOrder.id, "preparing");
    setSelectedOrder(null);
  };

  const confirmCancel = async () => {
    if (!selectedOrder) return;
    setIsCancelling(true);
    await updateOrderStatus(selectedOrder.id, "cancelled");
    setSelectedOrder(null);
    setIsCancelling(false);
  };

  const handleReadyMove = async (orderId) => {
    await updateOrderStatus(orderId, "ready");
  };

  const handleSendOrder = async (orderId) => {
    await updateOrderStatus(orderId, "delivered");
  };

  const counts = {
    new: orders.filter((o) => o.status === "new" && !o.scheduledFor).length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    scheduled: orders.filter((o) => o.status === "new" && Boolean(o.scheduledFor)).length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
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

      {isLoading && (
        <div className="text-secondary text-sm mb-4">جارٍ تحميل الطلبات...</div>
      )}

      {error && !isLoading && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</div>
      )}

      {!isLoading && orders.length === 0 && !error && (
        <div className="text-secondary text-sm mb-4">لا توجد طلبات حالياً.</div>
      )}

      <div dir="ltr" className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar items-start h-[calc(100vh-280px)] w-full">
        <KanbanColumn title="ملغي" status="cancelled" count={counts.cancelled} color="bg-error-red" isHidden={isFilterReady}>
          {orders.filter((o) => o.status === "cancelled").map((order) => (
            <OrderCard key={order.id} order={order} onShowDetails={handleShowDetails} />
          ))}
        </KanbanColumn>

        <KanbanColumn title="تم التسليم" status="delivered" count={counts.delivered} color="bg-success-green" isHidden={isFilterReady}>
          {orders.filter((o) => o.status === "delivered").map((order) => (
            <OrderCard key={order.id} order={order} onShowDetails={handleShowDetails} />
          ))}
        </KanbanColumn>

        <KanbanColumn title="جاهز" status="ready" count={counts.ready} color="bg-tertiary">
          {orders.filter((o) => o.status === "ready").map((order) => (
            <OrderCard key={order.id} order={order} onSend={handleSendOrder} onShowDetails={handleShowDetails} />
          ))}
        </KanbanColumn>

        <KanbanColumn title="قيد التحضير" status="preparing" count={counts.preparing} color="bg-pending-amber" isHidden={isFilterReady}>
          {orders.filter((o) => o.status === "preparing").map((order) => (
            <OrderCard key={order.id} order={order} onReady={handleReadyMove} onShowDetails={handleShowDetails} />
          ))}
        </KanbanColumn>

        <KanbanColumn title="طلبات جديدة" status="new" count={counts.new} color="bg-primary" isHidden={isFilterReady}>
          {orders.filter((o) => o.status === "new" && !o.scheduledFor).map((order) => (
            <OrderCard key={order.id} order={order} onAccept={handleShowDetails} onShowDetails={handleShowDetails} />
          ))}
        </KanbanColumn>

        <KanbanColumn title="مجدولة" status="scheduled" count={counts.scheduled} color="bg-primary" isHidden={isFilterReady}>
          {orders.filter((o) => o.status === "new" && Boolean(o.scheduledFor)).map((order) => (
            <OrderCard key={order.id} order={order} onAccept={handleShowDetails} onShowDetails={handleShowDetails} />
          ))}
        </KanbanColumn>
      </div>

      <OrderDetailsModal
        key={selectedOrder?.id ?? "order-details-modal"}
        selectedOrder={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onConfirm={confirmAcceptance}
        onCancel={confirmCancel}
        isCancelling={isCancelling}
      />
    </div>
  );
}
