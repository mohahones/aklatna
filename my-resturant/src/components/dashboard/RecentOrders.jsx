import { Link } from "react-router-dom";
import useOrders from "../../hooks/orders/useOrders";

function statusToColor(status) {
  if (!status) return "bg-primary";
  if (status === "delivered") return "bg-success-green";
  if (status === "preparing") return "bg-pending-amber";
  if (status === "ready") return "bg-blue-500";
  if (status === "cancelled") return "bg-error-red";
  return "bg-primary";
}

function statusLabel(status) {
  if (!status) return "";
  if (status === "delivered") return "تم التسليم";
  if (status === "preparing") return "قيد التحضير";
  if (status === "ready") return "جاهز";
  if (status === "new") return "جديد";
  if (status === "cancelled") return "تم الإلغاء";
  return status;
}

export default function RecentOrders() {
  const { orders, isLoading, error } = useOrders();

  const latest = orders && orders.length > 0 ? [...orders].slice(-5).reverse() : [];

  return (
    <section className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm p-6 text-right overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">الطلبات الأخيرة</h3>
        <Link to="/dashboard/orders" className="text-primary text-xs hover:underline">عرض الكل</Link>
      </div>

      {isLoading && <div className="text-secondary text-sm mb-2">جارٍ تحميل الطلبات...</div>}
      {error && !isLoading && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</div>}

      {!isLoading && latest.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-14 h-14 text-secondary/60 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 11h8M8 14h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="text-lg font-medium text-on-surface mb-1">لا يوجد طلبات</div>
          <div className="text-sm text-secondary">عند دخول طلبات جديدة ستظهر هنا أحدث 5 طلبات.</div>
        </div>
      )}

      <div className="space-y-4">
        {latest.map((order) => {
          const color = statusToColor(order.status);
          const priceText = typeof order.total === "number" ? `$${order.total.toFixed(2)}` : order.total || "-";

          return (
            <div key={order.id} className="relative p-4 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors group cursor-pointer">
              <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${color}`}></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm">{order.displayId}</p>
                  <p className="text-xs text-secondary">{order.customer}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{priceText}</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${color.replace(
                      "bg-",
                      "bg-opacity-10 text-"
                    )}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
