import React, { useState } from 'react';
import useOffers from '../../hooks/offers/useOffers';
import OfferCard from './OfferCard';
import ConfirmModal from '../ui/ConfirmModal';

export default function OfferList({ onEdit }) {
  const { offers, deleteOffer, toggleOfferStatus } = useOffers();
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [offerToToggle, setOfferToToggle] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleConfirmDelete = async () => {
    if (!offerToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteOffer(offerToDelete.id);
      if (error) {
        console.error('Delete offer failed:', error);
        return;
      }
    } finally {
      setIsDeleting(false);
      setOfferToDelete(null);
    }
  };

  const handleConfirmToggle = async () => {
    if (!offerToToggle) return;

    setIsToggling(true);
    try {
      const { error } = await toggleOfferStatus(offerToToggle.id, offerToToggle.nextValue);
      if (error) {
        console.error('Toggle offer failed:', error);
        return;
      }
    } finally {
      setIsToggling(false);
      setOfferToToggle(null);
    }
  };

  if (!offers || offers.length === 0) {
    return (
      <>
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white p-8 text-center shadow-sm">
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 shadow-inner">
              📣
            </div>
            <p className="text-lg font-bold text-slate-700">لا توجد عروض حالياً</p>
            <p className="text-sm text-slate-500">ابدأ بإضافة أول عرض جديد من النموذج أعلاه.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {offers.map((o) => (
          <OfferCard
            key={o.id}
            offer={o}
            onDelete={(id) => setOfferToDelete({ id, title: o.title })}
            onEdit={onEdit}
            onToggle={(nextOffer) => {
              setOfferToToggle({
                id: nextOffer.id,
                title: nextOffer.title,
                nextValue: Boolean(nextOffer.nextValue),
              });
            }}
          />
        ))}
      </div>

      <ConfirmModal
        isOpen={Boolean(offerToDelete)}
        title="تأكيد حذف العرض"
        description={offerToDelete ? `هل أنت متأكد من حذف العرض "${offerToDelete.title}"؟` : 'هل أنت متأكد من حذف هذا العرض؟'}
        confirmLabel={isDeleting ? 'جاري الحذف...' : 'حذف العرض'}
        cancelLabel="إلغاء"
        onClose={() => {
          if (isDeleting) return;
          setOfferToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        confirmClassName="rounded-2xl bg-error-red px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        iconClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        icon="close"
      />

      <ConfirmModal
        isOpen={Boolean(offerToToggle)}
        title={offerToToggle?.nextValue ? 'تأكيد تفعيل العرض' : 'تأكيد إيقاف العرض'}
        description={offerToToggle
          ? offerToToggle.nextValue
            ? `هل تريد تفعيل العرض "${offerToToggle.title}"؟`
            : `هل تريد إيقاف العرض "${offerToToggle.title}"؟`
          : 'هل تريد تحديث هذا العرض؟'}
        confirmLabel={isToggling ? 'جاري التحديث...' : offerToToggle?.nextValue ? 'تفعيل العرض' : 'إيقاف العرض'}
        cancelLabel="إلغاء"
        onClose={() => {
          if (isToggling) return;
          setOfferToToggle(null);
        }}
        onConfirm={handleConfirmToggle}
        confirmClassName="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        iconClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        icon="plus"
      />
    </>
  );
}
