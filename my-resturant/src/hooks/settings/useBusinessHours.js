import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";
import { createDefaultWorkingHours, WEEK_DAY_LABELS } from "../../data/settingsData";

function normalizeTime(value) {
  if (!value) return "09:00";
  const text = String(value);
  return text.length >= 5 ? text.slice(0, 5) : text;
}

function mapRowsToHours(rows = []) {
  const defaults = createDefaultWorkingHours();
  const byDay = new Map(
    (rows || []).map((row) => [Number(row.day_of_week), row])
  );

  return defaults.map((entry) => {
    const row = byDay.get(entry.dayOfWeek);
    if (!row) return entry;

    const isClosed = Boolean(row.is_closed);
    return {
      ...entry,
      day: WEEK_DAY_LABELS[entry.dayOfWeek] || entry.day,
      isOpen: !isClosed,
      openTime: normalizeTime(row.open_time) || entry.openTime,
      closeTime: normalizeTime(row.close_time) || entry.closeTime,
    };
  });
}

function mapHoursToRows(businessId, hours = []) {
  return hours.map((entry, index) => {
    const dayOfWeek = typeof entry.dayOfWeek === "number" ? entry.dayOfWeek : index;
    return {
      user_id: businessId,
      day_of_week: dayOfWeek,
      open_time: entry.isOpen ? entry.openTime || null : null,
      close_time: entry.isOpen ? entry.closeTime || null : null,
      is_closed: !entry.isOpen,
    };
  });
}

export default function useBusinessHours() {
  const [hours, setHours] = useState(createDefaultWorkingHours);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadHours = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase غير مهيأة");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const businessId = session?.user?.id;
      if (!businessId) {
        setError("لم يتم العثور على جلسة المستخدم");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("restaurant_hours")
        .select("day_of_week, open_time, close_time, is_closed")
        .eq("user_id", businessId)
        .order("day_of_week", { ascending: true });

      if (queryError) {
        console.error("Error loading business hours:", queryError);
        setError("فشل تحميل ساعات العمل");
        return;
      }

      setHours(mapRowsToHours(data || []));
      setError(null);
    } catch (err) {
      console.error("Exception loading business hours:", err);
      setError("حدث خطأ أثناء تحميل ساعات العمل");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHours();
  }, [loadHours]);

  function changeDay(index, updated) {
    setHours((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...updated } : entry)));
  }

  async function saveHours(nextHours = hours) {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error("Supabase غير مهيأة") };
    }

    setIsSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const businessId = session?.user?.id;
      if (!businessId) {
        return { error: new Error("لم يتم العثور على جلسة المستخدم") };
      }

      if (!Array.isArray(nextHours) || nextHours.length === 0) {
        return { error: new Error("جدول ساعات العمل غير صالح") };
      }

      const rows = mapHoursToRows(businessId, nextHours);

      // استبدال الجدول كاملاً لنفس المطعم
      const { error: deleteError } = await supabase
        .from("restaurant_hours")
        .delete()
        .eq("user_id", businessId);

      if (deleteError) throw deleteError;

      const { data, error: insertError } = await supabase
        .from("restaurant_hours")
        .insert(rows)
        .select("day_of_week, open_time, close_time, is_closed");

      if (insertError) throw insertError;

      const saved = mapRowsToHours(data || rows);
      setHours(saved);
      return { hours: saved, error: null };
    } catch (err) {
      console.error("Error saving business hours:", err);
      return { error: err };
    } finally {
      setIsSaving(false);
    }
  }

  return {
    hours,
    setHours,
    changeDay,
    isLoading,
    isSaving,
    error,
    saveHours,
  };
}
