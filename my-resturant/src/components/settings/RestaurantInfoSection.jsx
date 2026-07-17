export default function RestaurantInfoSection({
  info,
  onChange,
  onSave,
  isLoading = false,
  isSaving = false,
  error = null,
}) {
  return (
    <section className="bg-surface-container-lowest border border-border-subtle rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary">store</span>
        <h3 className="font-headline-md text-headline-md">معلومات المطعم</h3>
      </div>

      {isLoading ? (
        <p className="mb-4 font-body-md text-body-md text-secondary">جاري تحميل معلومات المطعم...</p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg bg-error-red/10 px-4 py-3 text-sm text-error-red">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
            اسم المطعم (عربي)
          </label>
          <input
            className="w-full px-4 py-3 bg-surface-container-lowest border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md text-body-md text-right disabled:opacity-60"
            placeholder="أدخل الاسم بالعربي"
            type="text"
            value={info.nameAr}
            disabled={isLoading || isSaving}
            onChange={(e) => onChange({ ...info, nameAr: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
            اسم المطعم (إنجليزي)
          </label>
          <input
            className="w-full px-4 py-3 bg-surface-container-lowest border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md text-body-md text-left disabled:opacity-60"
            dir="ltr"
            placeholder="Restaurant name in English"
            type="text"
            value={info.nameEn}
            disabled={isLoading || isSaving}
            onChange={(e) => onChange({ ...info, nameEn: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">رقم الهاتف</label>
          <input
            className="w-full px-4 py-3 bg-surface-container-lowest border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md text-body-md text-right disabled:opacity-60"
            dir="ltr"
            placeholder="+970..."
            type="tel"
            value={info.phone}
            disabled={isLoading || isSaving}
            onChange={(e) => onChange({ ...info, phone: e.target.value })}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">العنوان الفعلي</label>
          <textarea
            className="w-full px-4 py-3 bg-surface-container-lowest border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md text-body-md text-right disabled:opacity-60"
            placeholder="العنوان الكامل"
            rows={3}
            value={info.address}
            disabled={isLoading || isSaving}
            onChange={(e) => onChange({ ...info, address: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-8 flex justify-start">
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading || isSaving}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-body-md font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </section>
  );
}
