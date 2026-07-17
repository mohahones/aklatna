export default function CategoryDeleteModal({ isOpen, category, onClose, onConfirm }) {
  if (!isOpen || !category) return null;

  const dishCount = category.count ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-surface-container-lowest w-full max-w-[420px] overflow-hidden rounded-xl shadow-2xl flex flex-col animate-slide-in">
        <div className="px-8 py-6 border-b border-border-subtle">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">تأكيد حذف الفئة</h2>
          <p className="text-secondary font-body-md mt-2">
            هل أنت متأكد من حذف فئة <span className="font-bold text-on-surface">«{category.name}»</span>؟
          </p>
          {dishCount > 0 && (
            <p className="text-error font-body-md mt-3">
              سيتم حذف {dishCount} {dishCount === 1 ? "طبق" : "أطباق"} ضمن هذه الفئة.
            </p>
          )}
        </div>

        <div className="px-8 py-6 bg-surface-container-low flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-bold border border-border-subtle hover:bg-surface-container-high transition-all text-on-secondary-container"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-error text-on-error px-8 py-2.5 rounded-lg font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            حذف الفئة
          </button>
        </div>
      </div>
    </div>
  );
}
