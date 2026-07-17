import { useRef } from "react";

function ImagePreviewBlock({
  title,
  description,
  hint,
  previewUrl,
  emptyIcon,
  previewClassName,
  onSelectFile,
  onRemove,
  hasPendingChange = false,
}) {
  const fileInputRef = useRef(null);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    onSelectFile(file);
    event.target.value = "";
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative group w-full md:w-auto">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`overflow-hidden border-2 bg-white shadow-inner flex items-center justify-center transition-all cursor-pointer hover:border-primary ${
            hasPendingChange ? "border-primary" : "border-surface-container-high"
          } ${previewClassName}`}
          aria-label={`تغيير ${title}`}
        >
          {previewUrl ? (
            <img alt={title} className="w-full h-full object-cover" src={previewUrl} />
          ) : (
            <span className="material-symbols-outlined text-4xl text-secondary">{emptyIcon}</span>
          )}
          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
          </span>
        </button>
        <input
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          type="file"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex-1 space-y-4 w-full">
        <div>
          <h4 className="font-body-lg text-body-lg font-bold">{title}</h4>
          <p className="font-body-md text-body-md text-secondary">{description}</p>
          {hint ? <p className="mt-1 font-label-sm text-label-sm text-secondary">{hint}</p> : null}
          <p className="mt-2 font-label-sm text-label-sm text-primary">
            انقر على الصورة لتغييرها — التعديل يُحفظ بعد الضغط على «حفظ الصور» وتأكيد الحفظ.
          </p>
        </div>
        {previewUrl ? (
          <button
            type="button"
            onClick={onRemove}
            className="px-5 py-2 border border-border-subtle text-secondary rounded-lg font-body-md font-bold hover:bg-surface-container-low transition-all"
          >
            إزالة من المعاينة
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function LogoManagementSection({
  previewLogoUrl,
  previewCoverUrl,
  isLoading = false,
  isSaving = false,
  error = null,
  hasPendingChanges = false,
  onSelectLogoFile,
  onSelectCoverFile,
  onRemoveLogoPreview,
  onRemoveCoverPreview,
  onSave,
  hasPendingLogoChange = false,
  hasPendingCoverChange = false,
}) {
  return (
    <section className="bg-surface-container-lowest border border-border-subtle rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] p-6 space-y-8">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">image</span>
        <h3 className="font-headline-md text-headline-md">إدارة الشعار وصورة الغلاف</h3>
      </div>

      {isLoading ? (
        <p className="font-body-md text-body-md text-secondary">جاري تحميل الصور...</p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-error-red/10 px-4 py-3 text-sm text-error-red">{error}</p>
      ) : null}

      {!isLoading ? (
        <>
          <ImagePreviewBlock
            title="شعار المطعم"
            description="يظهر شعارك على إيصالات العملاء، تطبيق الطلبات، وتطبيقات سائقي التوصيل."
            hint="PNG أو SVG عالي الدقة (مربع)"
            previewUrl={previewLogoUrl}
            emptyIcon="store"
            previewClassName="relative w-40 h-40 rounded-xl"
            onSelectFile={onSelectLogoFile}
            onRemove={onRemoveLogoPreview}
            hasPendingChange={hasPendingLogoChange}
          />

          <div className="border-t border-border-subtle pt-8">
            <ImagePreviewBlock
              title="صورة الغلاف"
              description="تظهر في صفحة المطعم وواجهة الطلبات لإبراز هوية مطعمك."
              hint="PNG أو JPG (أفقي — يُفضّل 1200×600 بكسل)"
              previewUrl={previewCoverUrl}
              emptyIcon="panorama"
              previewClassName="relative w-full md:w-72 h-40 rounded-xl"
              onSelectFile={onSelectCoverFile}
              onRemove={onRemoveCoverPreview}
              hasPendingChange={hasPendingCoverChange}
            />
          </div>

          <div className="border-t border-border-subtle pt-6 flex flex-wrap items-center gap-3 justify-start">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || !hasPendingChanges}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-body-md font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ الصور"}
            </button>
            {hasPendingChanges ? (
              <span className="text-xs text-primary font-semibold">لديك تغييرات غير محفوظة</span>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
