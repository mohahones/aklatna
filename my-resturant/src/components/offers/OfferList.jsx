import React from 'react';
import useOffers from '../../hooks/offers/useOffers';
import OfferCard from './OfferCard';

export default function OfferList() {
  const { offers, deleteOffer } = useOffers();

  if (!offers || offers.length === 0) {
    return <div className="p-6 bg-white rounded-lg border border-border-subtle">لا توجد عروض حالياً.</div>;
  }

  return (
    <div className="grid gap-4">
      {offers.map((o) => (
        <OfferCard key={o.id} offer={o} onDelete={deleteOffer} />
      ))}
    </div>
  );
}
