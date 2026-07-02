import MaterialIcon from "../ui/MaterialIcon";

export function FilterSection({
  showFilters,
  onToggleFilters,
  timeRange,
  onTimeRangeChange,
  selectedStatuses,
  onStatusToggle,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleFilters}
        className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container"
      >
        <MaterialIcon name="filter_list" className="text-base" />
        تصفية النتائج
      </button>

      {showFilters && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border-subtle bg-white p-4 shadow-2xl">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-on-surface-variant">التاريخ</p>
              <div className="flex gap-2">
                {[
                  { label: "الكل", value: "الكل" },
                  { label: "آخر أسبوع", value: "آخر أسبوع" },
                  { label: "اليوم", value: "اليوم" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onTimeRangeChange(option.value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      timeRange === option.value
                        ? "bg-primary text-white"
                        : "bg-surface-container-low text-on-surface"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-on-surface-variant">الحالة</p>
              <div className="space-y-2">
                {[
                  { value: "pending", label: "بانتظار التأكيد" },
                  { value: "accepted", label: "مقبول" },
                  { value: "rejected", label: "مرفوض" },
                ].map((status) => (
                  <label key={status.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status.value)}
                      onChange={() => onStatusToggle(status.value)}
                      className="rounded border-border-subtle text-primary focus:ring-primary"
                    />
                    <span>{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleFilters}
              className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              تطبيق الفلتر
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
