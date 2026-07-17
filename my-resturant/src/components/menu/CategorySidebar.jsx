export default function CategorySidebar({
  categories,
  activeCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
}) {
  const canDelete = categories.length > 1;
  return (
    <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-6 shadow-sm sticky top-24">
      <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">الفئات</h3>
      <div className="space-y-2">
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          return (
            <div key={category.id} className="flex items-center gap-2">
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDeleteCategory(category)}
                  className="p-2.5 rounded-lg text-error hover:bg-error-container/20 transition-colors shrink-0"
                  aria-label={`حذف فئة ${category.name}`}
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg text-right transition-colors ${
                  isActive
                    ? "bg-primary-container text-on-primary-container font-bold"
                    : "text-secondary hover:bg-surface-container-low group"
                }`}
              >
                <span className="font-body-md text-body-md">{category.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-label-sm font-label-sm ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-surface-container-high group-hover:bg-white"
                  }`}
                >
                  {category.count}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onAddCategory}
        className="w-full mt-6 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-outline-variant rounded-xl text-outline hover:border-primary hover:text-primary transition-all font-bold"
      >
        <span className="material-symbols-outlined">add_circle</span>
        <span>إضافة فئة</span>
      </button>
    </div>
  );
}
