import React from 'react';

export default function OfferCard({ offer, onDelete, onEdit }) {
  return (
    <div className="border border-border-subtle rounded-lg p-4 flex items-start gap-4 bg-white">
      <div className="w-24 h-24 bg-surface-container flex-shrink-0 rounded-md overflow-hidden">
        {offer.imageUrl ? <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-on-surface-variant">صورة</div>}
      </div>
      <div className="flex-1">
        <h4 className="font-bold">{offer.title}</h4>
        <p className="text-sm text-on-surface-variant">{offer.desc}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
          <span>خصم: {offer.discountType === 'percentage' ? offer.discountValue + '%' : offer.discountValue + ' ر.س'}</span>
          <span>— الحد الأدنى: {offer.minOrder} ر.س</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button onClick={()=>onEdit?.(offer)} className="px-3 py-1 border rounded">تعديل</button>
        <button onClick={()=>onDelete?.(offer.id)} className="px-3 py-1 bg-error-red text-white rounded">حذف</button>
      </div>
    </div>
  );
}
