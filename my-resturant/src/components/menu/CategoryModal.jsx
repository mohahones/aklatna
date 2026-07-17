import { useEffect, useState } from "react";
import { CATEGORY_ICON_OPTIONS } from "../../data/menuData";

export default function CategoryModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICON_OPTIONS[0]);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setSelectedIcon(CATEGORY_ICON_OPTIONS[0]);
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, icon: selectedIcon });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-surface-container-lowest w-full max-w-[480px] overflow-hidden rounded-xl shadow-2xl flex flex-col animate-slide-in">
        <div className="px-8 py-6 border-b border-border-subtle flex justify-between items-center">
          <div>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">إضافة فئة جديدة</h2>
            <p className="text-secondary font-body-md">تنظيم قائمة الطعام الخاصة بك</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="font-body-md font-bold text-on-surface">اسم الفئة</label>
            <input
              className="w-full border border-border-subtle rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-body-md"
              placeholder="مثال: وجبات عائلية"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="font-body-md font-bold text-on-surface">اختر أيقونة</label>
            <div className="grid grid-cols-4 gap-4">
              {CATEGORY_ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-center group ${
                    selectedIcon === icon
                      ? "border-primary bg-primary/5"
                      : "border-border-subtle hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-2xl ${
                      selectedIcon === icon ? "text-primary" : "text-secondary group-hover:text-primary"
                    }`}
                  >
                    {icon}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-border-subtle bg-surface-container-low flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-bold border border-border-subtle hover:bg-surface-container-high transition-all text-on-secondary-container"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-primary text-on-primary px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            حفظ الفئة
          </button>
        </div>
      </div>
    </div>
  );
}
