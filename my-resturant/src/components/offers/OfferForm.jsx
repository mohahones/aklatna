import React, { useState } from 'react';
import OfferImageUploader from './OfferImageUploader';
import useOffers from '../../hooks/offers/useOffers';

export default function OfferForm() {
  const { addOffer } = useOffers();
  const [title, setTitle] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [desc, setDesc] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageFile, setImageFile] = useState(null);

  function clear() {
    setTitle('');
    setMinOrder('');
    setDesc('');
    setDiscountType('percentage');
    setDiscountValue('');
    setStartDate('');
    setEndDate('');
    setImageFile(null);
  }

  function onSubmit(e) {
    e.preventDefault();
    addOffer({
      title,
      minOrder: Number(minOrder) || 0,
      desc,
      discountType,
      discountValue: Number(discountValue) || 0,
      startDate,
      endDate,
      imageFile,
    });
    clear();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">عنوان العرض</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border-subtle" placeholder="مثال: خصم نهاية الأسبوع" />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">الحد الأدنى لقيمة الطلب</label>
          <input value={minOrder} onChange={(e)=>setMinOrder(e.target.value)} type="number" className="w-full px-3 py-2 rounded-lg border border-border-subtle" placeholder="0.00" />
        </div>
      </div>

      <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant">وصف العرض</label>
        <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border-subtle" placeholder="وصف تفصيلي للعرض" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">نوع الخصم</label>
          <div className="flex gap-2 mt-2">
            <label className="flex items-center gap-2"><input type="radio" checked={discountType==='percentage'} onChange={()=>setDiscountType('percentage')} /> <span className="mr-2">نسبة مئوية (%)</span></label>
            <label className="flex items-center gap-2"><input type="radio" checked={discountType==='fixed'} onChange={()=>setDiscountType('fixed')} /> <span className="mr-2">مبلغ ثابت</span></label>
          </div>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">قيمة الخصم</label>
          <input value={discountValue} onChange={(e)=>setDiscountValue(e.target.value)} type="number" className="w-full px-3 py-2 rounded-lg border border-border-subtle" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">تاريخ البدء</label>
          <input value={startDate} onChange={(e)=>setStartDate(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border-subtle" />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant">تاريخ الانتهاء</label>
          <input value={endDate} onChange={(e)=>setEndDate(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border-subtle" />
        </div>
      </div>

      <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant">الصورة الترويجية (اختياري)</label>
        <OfferImageUploader onFileSelected={(f)=>setImageFile(f)} />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={clear} className="px-6 py-2 border rounded-lg">إلغاء</button>
        <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg">حفظ العرض</button>
      </div>
    </form>
  );
}
