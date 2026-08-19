import useDayDetails from "../../hooks/useDayDetails";

export default function DayDetailsModal({ isOpen, onClose, dayName, dayDate }) {
  const { topItems, isLoading, error, totalRevenue, totalOrders, completedOrders, cancelledOrders, averageOrderValue } = useDayDetails(dayDate);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formattedRevenue = Number(totalRevenue || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedAvg = Number(averageOrderValue || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm cursor-pointer"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
          <h2 className="text-xl font-bold text-gray-800">تفاصيل يوم {dayName || "اليوم"}</h2>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-right text-sm text-secondary">جاري تحميل التفاصيل...</div>
          ) : error ? (
            <div className="text-right text-sm text-red-500">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f0f4ff] p-4 rounded-xl text-right">
                  <p className="text-xs text-gray-500 mb-1">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-primary">{formattedRevenue} ل.س</p>
                </div>
                <div className="bg-[#f0f4ff] p-4 rounded-xl text-right">
                  <p className="text-xs text-gray-500 mb-1">عدد الطلبات</p>
                  <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl text-right">
                  <p className="text-[11px] text-gray-500">مكتملة</p>
                  <p className="text-lg font-bold text-gray-800">{completedOrders}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl text-right">
                  <p className="text-[11px] text-gray-500">ملغاة</p>
                  <p className="text-lg font-bold text-gray-800">{cancelledOrders}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 text-right">الأصناف الأكثر مبيعاً</h3>
                <div className="space-y-2">
                  {topItems.length ? (
                    topItems.map((item) => (
                      <div key={item.id || item.item_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">{item.quantity_sold} طلب</span>
                        <span className="text-sm font-medium text-gray-700">{item.item_name || "عنصر"}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 text-right">لا توجد بيانات للأصناف لهذا اليوم</div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-800">{formattedAvg} ل.س</span>
                <span className="text-sm text-gray-400">متوسط قيمة الطلب</span>
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
