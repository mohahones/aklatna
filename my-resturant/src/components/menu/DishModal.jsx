import { useEffect, useRef, useState } from "react";
import {
  compressDishImage,
  uploadDishImage,
  validateDishImageFile,
} from "../../utils/dishImageUtils";

const EMPTY_FORM = {
  name: "",
  nameEn: "",
  description: "",
  price: "",
  categoryId: "",
  image: "",
  imagePath: "",
  ingredients: [],
};

export default function DishModal({ isOpen, mode, categories, initialData, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setImageError("");
    setFieldErrors({});
    setPendingImageFile(null);
    setIsDragActive(false);
    setIsCompressing(false);
    setIsSaving(false);

    if (mode === "edit" && initialData) {
      setForm({
        name: initialData.nameAr || initialData.name || "",
        nameEn: initialData.nameEn || "",
        description: initialData.description || "",
        price: String(initialData.price ?? ""),
        categoryId: initialData.categoryId || categories[0]?.id || "",
        image: initialData.image || "",
        imagePath: initialData.imagePath || "",
        ingredients: Array.isArray(initialData.ingredients)
          ? initialData.ingredients.map((item) => ({ ...item }))
          : [],
      });
      setImagePreview(initialData.image || "");
      previewUrlRef.current = "";
      return;
    }

    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? "",
      ingredients: [],
    });
    setImagePreview("");
    previewUrlRef.current = "";
  }, [isOpen, mode, initialData, categories]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
    };
  }, []);

  if (!isOpen) return null;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setPreviewFromBlob(file) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;
    setImagePreview(nextPreview);
  }

  async function handleImageFile(file) {
    const validationError = validateDishImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }

    setImageError("");
    setFieldErrors((prev) => ({ ...prev, image: "" }));
    setIsCompressing(true);

    try {
      const compressed = await compressDishImage(file);
      setPendingImageFile(compressed);
      setPreviewFromBlob(compressed);
    } catch {
      setImageError("تعذر ضغط الصورة. حاول مرة أخرى.");
    } finally {
      setIsCompressing(false);
    }
  }

  function handleFileChange(event) {
    handleImageFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragActive(false);
    handleImageFile(event.dataTransfer.files?.[0]);
  }

  function addIngredient() {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { id: crypto.randomUUID(), name: "", price: "" }],
    }));
  }

  function updateIngredient(id, field, value) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  }

  function removeIngredient(id) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((item) => item.id !== id),
    }));
  }

  async function handleSave() {
    if (isSaving || isCompressing) return;

    const nextErrors = {};
    const hasImageReady = Boolean(pendingImageFile || form.image || imagePreview);

    if (!hasImageReady) nextErrors.image = "صورة الطبق مطلوبة";
    if (!form.name.trim()) nextErrors.name = "اسم الطبق بالعربي مطلوب";
    if (!form.description.trim()) nextErrors.description = "الوصف مطلوب";
    if (!String(form.price).trim() || Number.parseFloat(form.price) <= 0) {
      nextErrors.price = "السعر مطلوب ويجب أن يكون أكبر من صفر";
    }
    if (!form.categoryId) nextErrors.categoryId = "الفئة مطلوبة";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.image) setImageError(nextErrors.image);
      return;
    }

    setFieldErrors({});
    setIsSaving(true);
    setImageError("");

    try {
      let image = form.image;
      let imagePath = form.imagePath;

      if (pendingImageFile) {
        const uploadResult = await uploadDishImage(pendingImageFile, {
          previousPath: mode === "edit" ? form.imagePath : null,
        });
        image = uploadResult.publicUrl;
        imagePath = uploadResult.path || "";
      }

      onSave({
        name: form.name.trim(),
        nameEn: form.nameEn.trim(),
        description: form.description.trim(),
        price: Number.parseFloat(form.price) || 0,
        categoryId: form.categoryId,
        image,
        imagePath,
        ingredients: form.ingredients
          .filter((item) => item.name.trim())
          .map((item) => ({
            ...item,
            price: Number.parseFloat(item.price) || 0,
          })),
      });
      onClose();
    } catch (error) {
      setImageError(error.message || "فشل حفظ صورة الطبق");
    } finally {
      setIsSaving(false);
    }
  }

  const hasImage = Boolean(imagePreview);
  const isBusy = isCompressing || isSaving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-md" onClick={isBusy ? undefined : onClose} />
      <div className="relative bg-surface-container-lowest w-full max-w-[560px] max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col animate-slide-in">
        <div className="px-8 py-6 border-b border-border-subtle flex justify-between items-center">
          <div>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              {mode === "edit" ? "تعديل الطبق" : "إضافة طبق جديد"}
            </h2>
            <p className="text-secondary font-body-md">تكوين تفاصيل الطبق والإضافات</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-3">
              <label className="font-body-md font-bold text-on-surface">
                صورة الطبق <span className="text-error">*</span>
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => !isBusy && fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && !isBusy && fileInputRef.current?.click()}
                onDragEnter={handleDragOver}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full h-48 border-2 border-dashed rounded-xl bg-surface-container-low flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
                  isDragActive
                    ? "border-primary bg-primary-fixed"
                    : "border-outline-variant hover:bg-surface-container hover:border-primary"
                } ${isBusy ? "pointer-events-none opacity-80" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  type="file"
                  onChange={handleFileChange}
                />

                {hasImage ? (
                  <>
                    <img className="absolute inset-0 w-full h-full object-cover" src={imagePreview} alt="معاينة صورة الطبق" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white font-bold px-4 py-2 border-2 border-white rounded-lg">
                        تغيير الصورة
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-secondary group-hover:text-primary transition-colors mb-2">
                      upload_file
                    </span>
                    <p className="font-body-md font-medium text-on-surface">قم بسحب وإفلات صورة الطبق هنا</p>
                    <p className="text-secondary font-label-sm mt-1">جودة عالية JPG أو PNG (الحد الأقصى 5 ميجابايت)</p>
                  </div>
                )}

                {isCompressing && (
                  <div className="absolute inset-0 bg-inverse-surface/50 flex items-center justify-center">
                    <p className="text-white font-bold text-sm">جاري ضغط الصورة...</p>
                  </div>
                )}
              </div>

              {pendingImageFile && !isCompressing && (
                <p className="text-success-green font-label-sm text-label-sm">
                  تم ضغط الصورة وجاهزة للرفع ({(pendingImageFile.size / 1024).toFixed(0)} ك.ب)
                </p>
              )}

              {imageError && <p className="text-error font-label-sm text-label-sm">{imageError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-gutter">
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="font-body-md font-bold text-on-surface">
                  اسم الطبق (عربي) <span className="text-error">*</span>
                </label>
                <input
                  className={`w-full border rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-body-md text-right ${
                    fieldErrors.name ? "border-error" : "border-border-subtle"
                  }`}
                  placeholder="مثال: برجر دجاج مشوي"
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    updateField("name", e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: "" }));
                  }}
                />
                {fieldErrors.name ? (
                  <p className="text-error font-label-sm text-label-sm">{fieldErrors.name}</p>
                ) : null}
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="font-body-md font-bold text-on-surface">
                  اسم الطبق (إنجليزي){" "}
                  <span className="text-secondary font-normal text-sm">(اختياري)</span>
                </label>
                <input
                  className="w-full border border-border-subtle rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-body-md text-left"
                  dir="ltr"
                  placeholder="e.g. Grilled Chicken Burger"
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => updateField("nameEn", e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="font-body-md font-bold text-on-surface">
                  الوصف <span className="text-error">*</span>
                </label>
                <textarea
                  className={`w-full border rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-body-md ${
                    fieldErrors.description ? "border-error" : "border-border-subtle"
                  }`}
                  placeholder="اكتب وصفاً قصيراً للطبق..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => {
                    updateField("description", e.target.value);
                    setFieldErrors((prev) => ({ ...prev, description: "" }));
                  }}
                />
                {fieldErrors.description ? (
                  <p className="text-error font-label-sm text-label-sm">{fieldErrors.description}</p>
                ) : null}
              </div>
              <div className="col-span-1 space-y-2">
                <label className="font-body-md font-bold text-on-surface">
                  السعر الأساسي ($) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary font-medium">$</span>
                  <input
                    className={`w-full border rounded-lg py-2.5 pr-8 pl-4 focus:ring-2 focus:ring-primary focus:border-primary text-body-md ${
                      fieldErrors.price ? "border-error" : "border-border-subtle"
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={form.price}
                    onChange={(e) => {
                      updateField("price", e.target.value);
                      setFieldErrors((prev) => ({ ...prev, price: "" }));
                    }}
                  />
                </div>
                {fieldErrors.price ? (
                  <p className="text-error font-label-sm text-label-sm">{fieldErrors.price}</p>
                ) : null}
              </div>
              <div className="col-span-1 space-y-2">
                <label className="font-body-md font-bold text-on-surface">
                  الفئة <span className="text-error">*</span>
                </label>
                <select
                  className={`w-full border rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-body-md ${
                    fieldErrors.categoryId ? "border-error" : "border-border-subtle"
                  }`}
                  value={form.categoryId}
                  onChange={(e) => {
                    updateField("categoryId", e.target.value);
                    setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
                  }}
                >
                  <option value="">اختر الفئة</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.categoryId ? (
                  <p className="text-error font-label-sm text-label-sm">{fieldErrors.categoryId}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <label className="font-body-md font-bold text-on-surface block">المكونات والإضافات</label>
              <div className="space-y-3">
                {form.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center gap-3 bg-surface-container-low p-3 rounded-lg border border-border-subtle"
                  >
                    <div className="flex-1">
                      <input
                        className="w-full border border-border-subtle rounded-lg py-2 px-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="اسم المكون"
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(ingredient.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="w-24 relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-label-sm">$</span>
                      <input
                        className="w-full border border-border-subtle rounded-lg py-2 pr-6 pl-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="0.00"
                        step="0.01"
                        type="number"
                        value={ingredient.price}
                        onChange={(e) => updateIngredient(ingredient.id, "price", e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngredient(ingredient.id)}
                      className="text-error hover:bg-error-container p-1.5 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-primary/30 rounded-xl text-primary hover:bg-primary/5 transition-all font-bold mt-2"
              >
                <span className="material-symbols-outlined">add</span>
                <span>إضافة مكون جديد</span>
              </button>
            </div>
          </form>
        </div>

        <div className="px-8 py-6 border-t border-border-subtle bg-surface-container-low flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-6 py-2.5 rounded-lg font-bold border border-border-subtle hover:bg-surface-container-high transition-all text-on-secondary-container disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isBusy}
            className="bg-primary text-on-primary px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {isSaving ? "جاري الرفع..." : "حفظ التعديلات"}
          </button>
        </div>
      </div>
    </div>
  );
}
