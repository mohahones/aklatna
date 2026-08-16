import React from 'react';
import OfferForm from '../components/offers/OfferForm';
import OfferList from '../components/offers/OfferList';

export default function OffersPage() {
  return (
    <div className="w-full px-4 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-border-subtle p-6 w-full">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">إضافة عرض جديد</h2>
            <OfferForm />
          </div>
        </div>

        <div className="lg:col-span-1">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-3">العروض الحالية</h3>
          <OfferList />
        </div>
      </div>
    </div>
  );
}
