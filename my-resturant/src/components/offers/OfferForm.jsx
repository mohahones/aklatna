import React, { useMemo, useState, useEffect } from 'react';
import OfferImageUploader from './OfferImageUploader';
import useOffers from '../../hooks/offers/useOffers';
import useMenu from '../../hooks/menu/useMenu';
import { ToastNotification } from '../CashPayment/ToastNotification';
import ConfirmModal from '../ui/ConfirmModal';


const emptyCustomForm = {
  title: '',
  minOrder: '',
  desc: '',
  discountValue: '',
  startDate: '',
  endDate: '',
  imageFile: null,
};

const emptyMenuForm = {
  category: '',
  item: '',
  title: '',
  minOrder: '',
  desc: '',
  discountValue: '',
  startDate: '',
  endDate: '',
  imageFile: null,
};

function normalizeDateInput(value) {
  if (!value) return '';
  const normalized = String(value).trim();
  if (!normalized) return '';

  const isoLike = normalized.includes('T') ? normalized.split('T')[0] : normalized;
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return isoLike.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export default function OfferForm({ editingOffer = null, onCancelEdit, onSaved }) {
  const { addOffer, updateOffer } = useOffers();
  const { categories, dishes } = useMenu();
  const [activeTab, setActiveTab] = useState('custom');
  const [customForm, setCustomForm] = useState(emptyCustomForm);
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [imageResetKey, setImageResetKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!editingOffer) {
      setCustomForm(emptyCustomForm);
      setMenuForm(emptyMenuForm);
      setErrors({});
      return;
    }

    const source = {
      title: editingOffer.title || editingOffer.raw?.label || '',
      minOrder: editingOffer.minOrder ?? editingOffer.raw?.old_price ?? '',
      desc: editingOffer.desc || editingOffer.raw?.description || '',
      discountValue: editingOffer.discountValue ?? editingOffer.raw?.discount_percentage ?? '',
      startDate: normalizeDateInput(editingOffer.startDate || editingOffer.raw?.start_promotions),
      endDate: normalizeDateInput(editingOffer.endDate || editingOffer.raw?.end_promotions),
      imageFile: null,
    };

    const hasMenuItem = Boolean(
      editingOffer.raw?.menu_item_id ||
      editingOffer.raw?.item ||
      editingOffer.raw?.category ||
      editingOffer.item ||
      editingOffer.category
    );

    setCustomForm(source);
    setMenuForm({
      ...emptyMenuForm,
      ...source,
      category: editingOffer.raw?.category || editingOffer.category || '',
      item: editingOffer.raw?.item || editingOffer.raw?.menu_item_id || editingOffer.item || '',
    });
    setActiveTab(hasMenuItem ? 'menu' : 'custom');
    setErrors({});
  }, [editingOffer]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const selectedMenuItems = useMemo(() => {
    const currentCategory = menuForm.category;
    if (!currentCategory) return [];
    return (dishes || [])
      .filter((d) => String(d.categoryId) === String(currentCategory))
      .map((d) => ({ value: d.id, label: d.name }));
  }, [menuForm.category, dishes]);

  function updateCustomForm(field, value) {
    setCustomForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateMenuForm(field, value) {
    setMenuForm((prev) => {
      if (field === 'category') {
        return { ...prev, category: value, item: '' };
      }

      // when selecting an item from the menu, set the natural price automatically
      if (field === 'item') {
        const selectedDish = (dishes || []).find((d) => String(d.id) === String(value));
        const price = selectedDish ? Number(selectedDish.price) || '' : '';
        return { ...prev, item: value, minOrder: price };
      }

      return { ...prev, [field]: value };
    });
  }

  function clearTab(tabName) {
    if (tabName === 'custom') {
      setCustomForm(emptyCustomForm);
      setErrors({});
      setImageResetKey((prev) => prev + 1);
      return;
    }

    setMenuForm(emptyMenuForm);
    setErrors({});
    setImageResetKey((prev) => prev + 1);
  }

  function getDiscountErrorMessage(value) {
    if (value === '' || value === null || value === undefined) {
      return 'قيمة الخصم مطلوبة';
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return 'قيمة الخصم غير صالحة';
    }

    if (numericValue <= 0) {
      return `كتبت ${value} أقل من الحد المطلوب 1`;
    }

    if (numericValue > 100) {
      return `كتبت ${value} أكبر من الحد المطلوب 100`;
    }

    return '';
  }

  function validateForm(formData) {
    const nextErrors = {};
    const existingImageUrl = editingOffer?.imageUrl || editingOffer?.raw?.photo_url || null;

    if (!String(formData.title || '').trim()) {
      nextErrors.title = 'العنوان مطلوب';
    }

    if (!String(formData.desc || '').trim()) {
      nextErrors.desc = 'الوصف مطلوب';
    }

    if (!formData.minOrder || Number(formData.minOrder) <= 0) {
      nextErrors.minOrder = 'السعر الطبيعي مطلوب';
    }

    const discountMessage = getDiscountErrorMessage(formData.discountValue);
    if (discountMessage) {
      nextErrors.discountValue = discountMessage;
    }

    if (!formData.startDate) {
      nextErrors.startDate = 'تاريخ البدء مطلوب';
    }

    if (!formData.endDate) {
      nextErrors.endDate = 'تاريخ الانتهاء مطلوب';
    }

    if (!formData.imageFile && !existingImageUrl) {
      nextErrors.imageFile = 'الصورة مطلوبة';
    }

    if (activeTab === 'menu') {
      if (!formData.category) nextErrors.category = 'اختر الفئة';
      if (!formData.item) nextErrors.item = 'اختر الوجبة';
    }

    return nextErrors;
  }

  async function submitOffer(formData) {
    const selectedDish = (dishes || []).find((d) => String(d.id) === String(formData.item));
    const existingImageUrl = editingOffer?.imageUrl || editingOffer?.raw?.photo_url || null;

    const payload = {
      title: formData.title,
      minOrder: Number(formData.minOrder) || 0,
      desc: formData.desc,
      discountType: 'percentage',
      discountValue: Number(formData.discountValue) || 0,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      imageFile: formData.imageFile || null,
      imageUrl: formData.imageFile ? null : existingImageUrl,
      ...(activeTab === 'menu'
        ? {
            category: formData.category || null,
            item: formData.item || null,
            itemName: selectedDish ? selectedDish.name : null,
          }
        : { category: null, item: null, itemName: null }),
    };

    try {
      setIsSaving(true);
      const result = editingOffer
        ? await updateOffer(editingOffer.id, payload)
        : await addOffer(payload);

      if (result && result.error) {
        console.error('Save promotion error:', result.error);
        setToast({ type: 'error', title: 'فشل الحفظ', message: result.error.message || String(result.error) });
        return;
      }

      clearTab(activeTab);
      onSaved?.();
      setToast({ type: 'success', title: 'تم', message: editingOffer ? 'تم تعديل العرض بنجاح' : 'تم حفظ العرض بنجاح' });
    } catch (err) {
      console.error('Unexpected error saving promotion:', err);
      setToast({ type: 'error', title: 'خطأ', message: 'حدث خطأ أثناء حفظ العرض' });
    } finally {
      setIsSaving(false);
      setPendingFormData(null);
      setIsConfirmOpen(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const formData = activeTab === 'custom' ? customForm : menuForm;
    const nextErrors = validateForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPendingFormData(formData);
    setIsConfirmOpen(true);
  }

  const renderBaseFields = (formData, updateForm, includeMenuSelectors = false) => (
    <>
      {includeMenuSelectors && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant">الفئة</label>
            <select
              value={formData.category}
              onChange={(e) => updateForm('category', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border bg-white ${errors.category ? 'border-red-500' : 'border-border-subtle'}`}
            >
              <option value="">اختر الفئة</option>
              {(categories || []).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant">الوجبة</label>
            <select
              value={formData.item}
              onChange={(e) => updateForm('item', e.target.value)}
              disabled={!formData.category}
              className={`w-full px-3 py-2 rounded-lg border bg-white disabled:opacity-60 ${errors.item ? 'border-red-500' : 'border-border-subtle'}`}
            >
              <option value="">اختر الوجبة</option>
              {selectedMenuItems.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            {errors.item && <p className="mt-1 text-xs text-red-500">{errors.item}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">عنوان العرض</label>
          <input
            value={formData.title}
            onChange={(e) => updateForm('title', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${errors.title ? 'border-red-500' : 'border-border-subtle'}`}
            placeholder="مثال: خصم نهاية الأسبوع"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">السعر الطبيعي</label>
          {includeMenuSelectors ? (
            <input
              value={formData.minOrder}
              readOnly
              type="number"
              className={`w-full px-3 py-2 rounded-lg border bg-primary/10 text-primary font-semibold cursor-not-allowed ${errors.minOrder ? 'border-red-500' : 'border-primary'}`}
              placeholder="0.00"
            />
          ) : (
            <input
              value={formData.minOrder}
              onChange={(e) => updateForm('minOrder', e.target.value)}
              type="number"
              className={`w-full px-3 py-2 rounded-lg border ${errors.minOrder ? 'border-red-500' : 'border-border-subtle'}`}
              placeholder="0.00"
            />
          )}
          {errors.minOrder && <p className="mt-1 text-xs text-red-500">{errors.minOrder}</p>}
        </div>
      </div>

      <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant">وصف العرض</label>
        <textarea
          value={formData.desc}
          onChange={(e) => updateForm('desc', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 rounded-lg border ${errors.desc ? 'border-red-500' : 'border-border-subtle'}`}
          placeholder="وصف تفصيلي للعرض"
        />
        {errors.desc && <p className="mt-1 text-xs text-red-500">{errors.desc}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
            <span>قيمة الخصم</span>
            <span className="text-gray-500 text-sm">%</span>
          </label>
          <div className={`flex items-center rounded-lg border overflow-hidden ${errors.discountValue ? 'border-red-500' : 'border-border-subtle'}`}>
            <input
              value={formData.discountValue}
              onChange={(e) => {
                const raw = e.target.value;
                const sanitized = raw.startsWith('-') ? raw.replace('-', '') : raw;
                updateForm('discountValue', sanitized);

                const message = getDiscountErrorMessage(sanitized);
                if (message) {
                  setErrors((prev) => ({ ...prev, discountValue: message }));
                  return;
                }

                setErrors((prev) => ({ ...prev, discountValue: '' }));
              }}
              type="number"
              min="1"
              max="100"
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'Subtract') {
                  e.preventDefault();
                }
              }}
              className="w-full px-3 py-2 bg-transparent outline-none"
            />
            <span className="px-3 text-gray-500 text-lg">%</span>
          </div>
          {errors.discountValue && <p className="mt-1 text-xs text-red-500">{errors.discountValue}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">تاريخ البدء</label>
          <input
            value={formData.startDate}
            onChange={(e) => updateForm('startDate', e.target.value)}
            type="date"
            className={`w-full px-3 py-2 rounded-lg border ${errors.startDate ? 'border-red-500' : 'border-border-subtle'}`}
          />
          {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">تاريخ الانتهاء</label>
          <input
            value={formData.endDate}
            onChange={(e) => updateForm('endDate', e.target.value)}
            type="date"
            className={`w-full px-3 py-2 rounded-lg border ${errors.endDate ? 'border-red-500' : 'border-border-subtle'}`}
          />
          {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
        </div>
      </div>

      <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant">الصورة الترويجية</label>
        <OfferImageUploader
          key={imageResetKey}
          initialImageUrl={editingOffer?.imageUrl || editingOffer?.raw?.photo_url || null}
          error={errors.imageFile}
          onFileSelected={(file) => {
            updateForm('imageFile', file);
            setErrors((prev) => ({ ...prev, imageFile: '' }));
          }}
        />
      </div>
    </>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg border transition ${activeTab === 'custom' ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface border-border-subtle'} ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          عرض لوجبة غير موجودة في القائمة
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg border transition ${activeTab === 'menu' ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface border-border-subtle'} ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          عرض لوجبة موجودة في القائمة
        </button>
      </div>

      {activeTab === 'custom' ? (
        renderBaseFields(customForm, updateCustomForm, false)
      ) : (
        renderBaseFields(menuForm, updateMenuForm, true)
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => {
            if (editingOffer) {
              onCancelEdit?.();
            }
            clearTab(activeTab);
          }}
          className="px-6 py-2 border rounded-lg"
        >
          إلغاء
        </button>
        <button type="submit" disabled={isSaving} className={`px-6 py-2 rounded-lg ${isSaving ? 'bg-primary/60 text-white' : 'bg-primary text-white'}`}>
          {isSaving ? 'جاري الحفظ...' : editingOffer ? 'تحديث العرض' : 'حفظ العرض'}
        </button>
      </div>
      {toast && <ToastNotification toast={toast} />}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={editingOffer ? 'تأكيد تعديل العرض' : 'تأكيد حفظ العرض'}
        description={editingOffer ? 'هل أنت متأكد من حفظ التعديلات على هذا العرض؟' : 'هل أنت متأكد من حفظ هذا العرض؟'}
        confirmLabel={isSaving ? 'جارٍ الحفظ...' : editingOffer ? 'تحديث العرض' : 'حفظ العرض'}
        cancelLabel="إلغاء"
        onClose={() => {
          if (isSaving) return;
          setIsConfirmOpen(false);
          setPendingFormData(null);
        }}
        onConfirm={() => {
          if (!pendingFormData) return;
          submitOffer(pendingFormData);
        }}
        confirmClassName="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        iconClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        icon="plus"
      />
    </form>
  );
}
