// RecentOrders uses JSX only; no React import required

const orders = [
  { id: "#ORD-4291", name: "سارة جينكينز", price: "$42.50", status: "تم التوصيل", color: "bg-success-green" },
  { id: "#ORD-4290", name: "مايكل تشن", price: "$18.20", status: "قيد التنفيذ", color: "bg-pending-amber" },
  { id: "#ORD-4289", name: "إيلينا رودريغيز", price: "$112.00", status: "قيد التحضير", color: "bg-pending-amber" },
  { id: "#ORD-4288", name: "ديفيد سميث", price: "$34.15", status: "تم التوصيل", color: "bg-success-green" },
  { id: "#ORD-4287", name: "كارين ويلسون", price: "$22.90", status: "تم الإلغاء", color: "bg-error-red" },
];

export default function RecentOrders() {
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm p-6 text-right overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">الطلبات الأخيرة</h3>
        <a className="text-primary text-xs hover:underline" href="#">عرض الكل</a>
      </div>
      <div className="space-y-4">
        {orders.map((order, idx) => (
          <div key={idx} className="relative p-4 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors group cursor-pointer">
            <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${order.color}`}></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm">{order.id}</p>
                <p className="text-xs text-secondary">{order.name}</p>
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{order.price}</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.color.replace(
                    "bg-",
                    "bg-opacity-10 text-"
                  )}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
