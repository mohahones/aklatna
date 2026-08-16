import { useState, useEffect } from 'react';

function makeId() {
  return `offer-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

// Simple local-state hook for offers. Replace persistence with Supabase calls later.
export default function useOffers() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    // Load from localStorage if present
    try {
      const raw = localStorage.getItem('offers');
      if (raw) setOffers(JSON.parse(raw));
    } catch (e) {
      console.warn('failed loading offers', e);
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('offers', JSON.stringify(offers)); } catch (e) {}
  }, [offers]);

  function addOffer(payload) {
    const newItem = Object.assign({ id: makeId(), createdAt: new Date().toISOString() }, payload);
    setOffers((s) => [newItem, ...s]);
  }

  function deleteOffer(id) {
    setOffers((s) => s.filter((x) => x.id !== id));
  }

  function updateOffer(id, patch) {
    setOffers((s) => s.map((x) => (x.id === id ? Object.assign({}, x, patch) : x)));
  }

  return { offers, addOffer, deleteOffer, updateOffer };
}
