export default function OfferCard({ offer, onDelete, onEdit, onToggle }) {
  const imageUrl = offer.imageUrl || offer.photo_url || offer.image || '';
  const isEnabled = offer.isActive !== false;
  const discountLabel = offer.discountType === 'percentage'
    ? `${offer.discountValue || 0}%`
    : `${offer.discountValue || 0} ل.س`;

  function handleToggle() {
    const nextValue = !isEnabled;
    onToggle?.({ ...offer, nextValue });
  }

  return (
    <div className="group rounded-2xl border border-border-subtle bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container ring-1 ring-slate-200">
          {imageUrl ? (
            <img src={imageUrl} alt={offer.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-on-surface-variant">صورة</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-lg font-bold text-on-surface">{offer.title}</h4>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              {discountLabel}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
            <span className="rounded-full bg-surface-container px-2 py-1">السعر الطبيعي: {offer.minOrder || 0} ل.س</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
        <button
          type="button"
          aria-label={isEnabled ? 'تعطيل العرض' : 'تفعيل العرض'}
          className={`relative inline-flex h-7 w-12 items-center rounded-full border border-transparent transition-colors duration-200 ${isEnabled ? 'bg-primary' : 'bg-slate-300'}`}
          onClick={handleToggle}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${isEnabled ? 'left-1' : 'left-6'}`}
          />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(offer)}
            className="rounded-lg border border-border-subtle bg-white px-3 py-1.5 text-sm font-medium text-on-surface transition hover:border-primary hover:text-primary"
          >
            تعديل
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(offer.id)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}
