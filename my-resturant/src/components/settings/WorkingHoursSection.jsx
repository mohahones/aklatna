function WorkingHoursRow({ entry, onChange, disabled = false }) {
  const statusClass = entry.isOpen ? "text-success-green" : "text-secondary";
  const statusLabel = entry.isOpen ? "مفتوح" : "مغلق";
  const rowClass = !entry.isOpen ? "bg-surface-container-high/30" : "hover:bg-surface-container-low";

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg transition-colors ${rowClass}`}>
      <div className={`flex-1 min-w-0 ${!entry.isOpen ? "opacity-50" : ""}`}>
        <p className={`font-body-md font-bold ${entry.highlight ? "text-primary" : ""}`}>
          {entry.day}
        </p>
        <div className={`flex flex-col sm:flex-row sm:items-center gap-2 mt-1 min-w-0 ${!entry.isOpen ? "opacity-30" : ""}`} dir="ltr">
          <input
            className="w-full sm:w-auto max-w-full bg-transparent border-none p-0 text-label-sm font-label-sm focus:ring-0 cursor-pointer text-right disabled:cursor-not-allowed"
            type="time"
            value={entry.openTime}
            disabled={disabled || !entry.isOpen}
            onChange={(e) => onChange({ ...entry, openTime: e.target.value })}
          />
          <span className="text-secondary">-</span>
          <input
            className="w-full sm:w-auto max-w-full bg-transparent border-none p-0 text-label-sm font-label-sm focus:ring-0 cursor-pointer text-right disabled:cursor-not-allowed"
            type="time"
            value={entry.closeTime}
            disabled={disabled || !entry.isOpen}
            onChange={(e) => onChange({ ...entry, closeTime: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-3 sm:mt-0 flex flex-col items-end gap-1 min-w-[90px]">
        <label className={`relative inline-flex items-center ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            className="sr-only peer"
            checked={entry.isOpen}
            disabled={disabled}
            onChange={(e) => onChange({ ...entry, isOpen: e.target.checked })}
          />
          <div className="w-11 h-6 bg-secondary-container rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
        </label>
        <span className={`text-[10px] uppercase font-bold ${statusClass}`}>{statusLabel}</span>
      </div>
    </div>
  );
}

export default function WorkingHoursSection({
  hours,
  onChangeDay,
  onSave,
  isLoading = false,
  isSaving = false,
  error = null,
}) {
  return (
    <section className="bg-surface-container-lowest border border-border-subtle rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] h-full">
      <div className="p-6 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary">schedule</span>
          <h3 className="font-headline-md text-headline-md">ساعات العمل</h3>
        </div>
        <p className="font-label-sm text-label-sm text-secondary">حدد جدولك التشغيلي</p>
      </div>

      {isLoading ? (
        <p className="p-4 font-body-md text-body-md text-secondary">جاري تحميل ساعات العمل...</p>
      ) : null}

      {error ? (
        <p className="mx-4 mt-4 rounded-lg bg-error-red/10 px-4 py-3 text-sm text-error-red">{error}</p>
      ) : null}

      <div className="p-4 space-y-4">
        {hours.map((entry, index) => (
          <WorkingHoursRow
            key={`${entry.dayOfWeek ?? index}-${entry.day}`}
            entry={entry}
            disabled={isLoading || isSaving}
            onChange={(updated) => onChangeDay(index, updated)}
          />
        ))}
      </div>
      <div className="p-4 bg-surface-container-low border-t border-border-subtle rounded-b-xl">
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading || isSaving}
          className="w-full py-3 bg-secondary text-on-secondary rounded-lg font-body-md font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "جاري التحديث..." : "تحديث الجدول"}
        </button>
      </div>
    </section>
  );
}
