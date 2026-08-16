import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../../supabaseClient';

const logoBucketName = 'restaurant-logos';

function buildPromotionPath(file, businessId) {
  const originalName = file.name || 'offer-image';
  const extension = originalName.includes('.') ? originalName.split('.').pop() : (file.type?.split('/')[1] || 'jpg');
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `promotions/${businessId || 'public'}/${suffix}.${extension}`;
}

function makeId() {
  return `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapPromotionItem(item) {
  return {
    id: item.id,
    createdAt: item.created_at || new Date().toISOString(),
    title: item.label || item.menu_item_name || 'عرض',
    desc: item.description || '',
    discountType: 'percentage',
    discountValue: Number(item.discount_percentage) || 0,
    minOrder: Number(item.old_price ?? item.minOrder ?? 0) || 0,
    startDate: item.start_promotions || '',
    endDate: item.end_promotions || '',
    imageUrl: item.photo_url || null,
    category: item.category || '',
    item: item.menu_item_id || '',
    isActive: item.is_active !== false,
    raw: item,
  };
}

export default function useOffers() {
  const [offers, setOffers] = useState([]);

  async function fetchOffersFromSupabase() {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let query = supabase.from('promotions').select('*');
      if (session?.user?.id) {
        query = query.eq('business_id', session.user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      setOffers((data || []).map(mapPromotionItem));
    } catch (e) {
      console.warn('failed loading promotions from Supabase', e);
    }
  }

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      fetchOffersFromSupabase();
      return;
    }

    try {
      const raw = localStorage.getItem('offers');
      if (raw) setOffers(JSON.parse(raw));
    } catch (e) {
      console.warn('failed loading offers', e);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      return;
    }

    try {
      localStorage.setItem('offers', JSON.stringify(offers));
    } catch (e) {
      console.warn('failed saving offers', e);
    }
  }, [offers]);

  async function buildPromotionRecord(session, payload) {
    const businessId = session?.user?.id;
    if (!businessId) {
      throw new Error('لم يتم العثور على جلسة المستخدم');
    }

    const priceValue = Number(payload.minOrder ?? 0) || 0;
    const discountPercent = Number(payload.discountPercent ?? payload.discountValue ?? 0) || 0;
    const calculatedNewPrice =
      discountPercent > 0 ? Number(((priceValue * (100 - discountPercent)) / 100).toFixed(2)) : priceValue;

    const menuItemId = payload.targetId ?? payload.item ?? payload.menu_item_id ?? null;
    const hasDishTarget = Boolean(payload.targetType === 'dish' || menuItemId || payload.item);
    const resolvedMenuItemName = hasDishTarget ? (payload.targetName || payload.itemName || payload.menu_item_name || 'وجبة') : null;

    let photoUrl = payload.imageUrl || null;

    if (payload.imageFile instanceof File) {
      const path = buildPromotionPath(payload.imageFile, businessId);
      const { error: uploadError } = await supabase.storage.from(logoBucketName).upload(path, payload.imageFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: payload.imageFile.type,
      });

      if (uploadError) {
        console.error('promotion image upload failed:', uploadError);
        throw new Error(`فشل رفع الصورة: ${uploadError.message}`);
      }

      const { data: publicData } = supabase.storage.from(logoBucketName).getPublicUrl(path);
      photoUrl = publicData?.publicUrl || null;
    }

    return {
      business_id: businessId,
      label: payload.title || null,
      description: payload.desc || null,
      discount_percentage: discountPercent,
      is_active: true,
      menu_item_id: menuItemId,
      menu_item_name: resolvedMenuItemName,
      old_price: priceValue,
      new_price: calculatedNewPrice,
      start_promotions: payload.startDate || null,
      end_promotions: payload.endDate || null,
      photo_url: photoUrl,
    };
  }

  async function addOffer(payload) {
    if (isSupabaseConfigured && supabase) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const record = await buildPromotionRecord(session, payload);

        const { data, error: insertError } = await supabase
          .from('promotions')
          .insert(record)
          .select('*')
          .single();

        if (insertError) {
          console.error('promotion insert failed:', insertError);
          throw insertError;
        }

        const uiItem = {
          id: data.id ?? makeId(),
          createdAt: data.created_at || new Date().toISOString(),
          title: data.label || data.menu_item_name || '',
          desc: data.description || '',
          discountType: 'percentage',
          discountValue: Number(data.discount_percentage) || 0,
          minOrder: Number(data.old_price) || null,
          imageUrl: data.photo_url || null,
          raw: data,
        };

        setOffers((s) => [uiItem, ...s]);
        return { promotion: data, error: null };
      } catch (err) {
        console.error('Failed saving promotion:', err);

        const fallbackItem = {
          id: makeId(),
          createdAt: new Date().toISOString(),
          title: payload.title || '',
          desc: payload.desc || '',
          discountType: 'percentage',
          discountValue: Number(payload.discountPercent ?? payload.discountValue ?? 0) || 0,
          minOrder: Number(payload.minOrder ?? 0) || null,
          imageUrl: payload.imageUrl || null,
          raw: payload,
        };

        setOffers((s) => [fallbackItem, ...s]);
        return { promotion: fallbackItem, error: err };
      }
    }

    const newItem = Object.assign({ id: makeId(), createdAt: new Date().toISOString() }, payload);
    setOffers((s) => [newItem, ...s]);
    return { promotion: newItem, error: null };
  }

  async function deleteOffer(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('promotions').delete().eq('id', id);
        if (error) {
          console.error('promotion delete failed:', error);
          return { error };
        }

        setOffers((s) => s.filter((x) => String(x.id) !== String(id)));
        return { error: null };
      } catch (err) {
        console.error('Failed deleting promotion:', err);
        return { error: err };
      }
    }

    setOffers((s) => s.filter((x) => String(x.id) !== String(id)));
    return { error: null };
  }

  async function toggleOfferStatus(id, nextValue) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('promotions')
          .update({ is_active: nextValue })
          .eq('id', id);

        if (error) {
          console.error('promotion toggle failed:', error);
          return { error };
        }

        setOffers((s) => s.map((x) => String(x.id) === String(id)
          ? { ...x, isActive: nextValue, raw: { ...x.raw, is_active: nextValue } }
          : x
        ));
        return { error: null };
      } catch (err) {
        console.error('Failed toggling promotion:', err);
        return { error: err };
      }
    }

    setOffers((s) => s.map((x) => String(x.id) === String(id)
      ? { ...x, isActive: nextValue, raw: { ...x.raw, is_active: nextValue } }
      : x
    ));
    return { error: null };
  }

  async function updateOffer(id, patch) {
    if (isSupabaseConfigured && supabase) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const record = await buildPromotionRecord(session, patch);

        const { data, error: updateError } = await supabase
          .from('promotions')
          .update(record)
          .eq('id', id)
          .select('*')
          .single();

        if (updateError) {
          console.error('promotion update failed:', updateError);
          throw updateError;
        }

        const mapped = mapPromotionItem(data);
        setOffers((s) => s.map((x) => (x.id === id ? mapped : x)));
        return { promotion: data, error: null };
      } catch (err) {
        console.error('Failed updating promotion:', err);
        setOffers((s) => s.map((x) => (x.id === id ? { ...x, ...patch, raw: { ...x.raw, ...patch } } : x)));
        return { promotion: null, error: err };
      }
    }

    setOffers((s) => s.map((x) => (x.id === id ? { ...x, ...patch, raw: { ...x.raw, ...patch } } : x)));
    return { promotion: null, error: null };
  }

  return { offers, addOffer, deleteOffer, updateOffer, toggleOfferStatus };
}
