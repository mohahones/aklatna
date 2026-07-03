// DayDetailsModal uses JSX only; no React import required

export default function DayDetailsModal({ isOpen, onClose, dayName }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
          <h2 className="text-xl font-bold text-gray-800">تفاصيل يوم {dayName || "الخميس"}</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#f0f4ff] p-4 rounded-xl text-right">
              <p className="text-xs text-gray-500 mb-1">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-primary">$1,420</p>
            </div>
            <div className="bg-[#f0f4ff] p-4 rounded-xl text-right">
              <p className="text-xs text-gray-500 mb-1">عدد الطلبات</p>
              <p className="text-2xl font-bold text-gray-800">45</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3 text-right">الأصناف الأكثر مبيعاً</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">18 طلب</span>
                <span className="text-sm font-medium text-gray-700">سلطة سيزر</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">9 طلب</span>
                <span className="text-sm font-medium text-gray-700">بيتزا مارجريتا</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-lg font-bold text-gray-800">$31.56</span>
            <span className="text-sm text-gray-400">متوسط قيمة الطلب</span>
          </div>
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
