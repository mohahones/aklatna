import { useMemo, useState } from "react";
import CategorySidebar from "../components/menu/CategorySidebar";
import DishCard from "../components/menu/DishCard";
import DishModal from "../components/menu/DishModal";
import CategoryModal from "../components/menu/CategoryModal";
import CategoryDeleteModal from "../components/menu/CategoryDeleteModal";
import useMenu from "../hooks/menu/useMenu";

export default function MenuPage() {
  const {
    categories,
    dishes,
    isLoading,
    error,
    addCategory,
    deleteCategory,
    saveDish,
    toggleDishAvailability,
  } = useMenu();

  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [dishModal, setDishModal] = useState({ open: false, mode: "add", dishId: null });
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const resolvedActiveCategoryId =
    activeCategoryId && categories.some((category) => category.id === activeCategoryId)
      ? activeCategoryId
      : categories[0]?.id || "";

  const filteredDishes = useMemo(
    () => dishes.filter((dish) => dish.categoryId === resolvedActiveCategoryId),
    [dishes, resolvedActiveCategoryId]
  );

  const editingDish = dishModal.dishId
    ? dishes.find((dish) => dish.id === dishModal.dishId)
    : null;

  function showActionError(message) {
    setActionError(message);
    window.clearTimeout(showActionError.timeoutId);
    showActionError.timeoutId = window.setTimeout(() => setActionError(null), 4000);
  }

  function openAddDishModal() {
    if (!categories.length) {
      showActionError("أضف فئة أولاً قبل إضافة طبق.");
      return;
    }
    setDishModal({ open: true, mode: "add", dishId: null });
  }

  function openEditDishModal(dish) {
    setDishModal({ open: true, mode: "edit", dishId: dish.id });
  }

  function closeDishModal() {
    setDishModal({ open: false, mode: "add", dishId: null });
  }

  async function handleToggleAvailability(dishId) {
    const { error: toggleError } = await toggleDishAvailability(dishId);
    if (toggleError) {
      showActionError(toggleError.message || "فشل تحديث حالة التوفر");
    }
  }

  async function handleSaveDish(formData) {
    setIsBusy(true);
    const { error: saveError } = await saveDish({
      mode: dishModal.mode,
      dishId: dishModal.dishId,
      formData,
    });
    setIsBusy(false);

    if (saveError) {
      showActionError(saveError.message || "فشل حفظ الطبق");
      return;
    }
  }

  async function handleAddCategory({ name }) {
    setIsBusy(true);
    const { category, error: addError } = await addCategory({ name });
    setIsBusy(false);

    if (addError) {
      showActionError(addError.message || "فشل إضافة الفئة");
      return;
    }

    if (category?.id) {
      setActiveCategoryId(category.id);
    }
  }

  function handleRequestDeleteCategory(category) {
    if (categories.length <= 1) return;
    const dishCount = dishes.filter((dish) => dish.categoryId === category.id).length;
    setCategoryToDelete({ ...category, count: dishCount });
  }

  async function handleConfirmDeleteCategory() {
    if (!categoryToDelete || categories.length <= 1) {
      setCategoryToDelete(null);
      return;
    }

    const deletedId = categoryToDelete.id;
    setIsBusy(true);
    const { error: deleteError } = await deleteCategory(deletedId);
    setIsBusy(false);

    if (deleteError) {
      showActionError(deleteError.message || "فشل حذف الفئة");
      setCategoryToDelete(null);
      return;
    }

    if (resolvedActiveCategoryId === deletedId) {
      const remaining = categories.filter((category) => category.id !== deletedId);
      setActiveCategoryId(remaining[0]?.id ?? "");
    }

    setCategoryToDelete(null);
  }

  return (
    <div className="px-8 pb-12 pt-6 min-w-0">
      <div className="max-w-container-max mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface">إدارة القائمة</h2>
            <p className="font-body-lg text-body-lg text-secondary">أدر فئات مطعمك والأطباق الموسمية.</p>
          </div>
          <button
            type="button"
            onClick={openAddDishModal}
            disabled={isBusy || isLoading}
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            <span className="material-symbols-outlined">add</span>
            <span>إضافة طبق</span>
          </button>
        </div>

        {isLoading ? (
          <p className="mb-6 text-secondary">جاري تحميل القائمة...</p>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-error-red/30 bg-error-red/5 px-4 py-3 text-sm text-error-red">
            {error}
          </div>
        ) : null}

        {actionError ? (
          <div className="mb-6 rounded-xl border border-error-red/30 bg-error-red/5 px-4 py-3 text-sm text-error-red">
            {actionError}
          </div>
        ) : null}

        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 lg:col-span-3">
            <CategorySidebar
              categories={categories}
              activeCategoryId={resolvedActiveCategoryId}
              onSelectCategory={setActiveCategoryId}
              onAddCategory={() => setCategoryModalOpen(true)}
              onDeleteCategory={handleRequestDeleteCategory}
            />
          </div>

          <div className="col-span-12 lg:col-span-9">
            {!isLoading && categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low/40 p-10 text-center">
                <p className="font-headline-md text-headline-md text-on-surface">لا توجد فئات بعد</p>
                <p className="mt-2 text-secondary">ابدأ بإضافة فئة ثم أضف أطباقك.</p>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-on-primary"
                >
                  <span className="material-symbols-outlined">add</span>
                  إضافة فئة
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onEdit={openEditDishModal}
                    onToggleAvailability={handleToggleAvailability}
                  />
                ))}

                <button
                  type="button"
                  onClick={openAddDishModal}
                  className="flex flex-col items-center justify-center gap-4 bg-surface-container-low/50 border-2 border-dashed border-outline-variant rounded-xl p-8 hover:border-primary group transition-all h-full min-h-[400px]"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary">
                      add_circle
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block font-headline-md text-headline-md text-on-surface">
                      إضافة طبق جديد
                    </span>
                    <span className="block text-secondary text-body-md mt-1">رفع صورة وتحديد السعر</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DishModal
        isOpen={dishModal.open}
        mode={dishModal.mode}
        categories={categories}
        initialData={editingDish}
        onClose={closeDishModal}
        onSave={handleSaveDish}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleAddCategory}
      />

      <CategoryDeleteModal
        isOpen={Boolean(categoryToDelete)}
        category={categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDeleteCategory}
      />
    </div>
  );
}
