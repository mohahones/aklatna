import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";

const EMPTY_INFO = {
  nameAr: "",
  nameEn: "",
  phone: "",
  address: "",
};

export default function useBusinessInfo() {
  const [info, setInfo] = useState(EMPTY_INFO);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadInfo = useCallback(async () => {
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
        .from("businesses")
        .select("name, name_ar, phone, address")
        .eq("id", businessId)
        .maybeSingle();

      if (queryError) {
        console.error("Error loading business info:", queryError);
        setError("فشل تحميل معلومات المطعم");
        return;
      }

      setInfo({
        nameAr: data?.name_ar || "",
        nameEn: data?.name || "",
        phone: data?.phone || "",
        address: data?.address || "",
      });
      setError(null);
    } catch (err) {
      console.error("Exception loading business info:", err);
      setError("حدث خطأ أثناء تحميل معلومات المطعم");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  async function saveInfo(nextInfo) {
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

      const payload = {
        name_ar: String(nextInfo.nameAr ?? "").trim(),
        name: String(nextInfo.nameEn ?? "").trim(),
        phone: String(nextInfo.phone ?? "").trim(),
        address: String(nextInfo.address ?? "").trim(),
      };

      if (!payload.name_ar) {
        return { error: new Error("اسم المطعم بالعربي مطلوب") };
      }
      if (!payload.phone) {
        return { error: new Error("رقم الهاتف مطلوب") };
      }
      if (!payload.address) {
        return { error: new Error("العنوان مطلوب") };
      }

      const { data, error: updateError } = await supabase
        .from("businesses")
        .update(payload)
        .eq("id", businessId)
        .select("name, name_ar, phone, address")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) {
        return { error: new Error("تعذر حفظ المعلومات. تحقق من صلاحيات التحديث.") };
      }

      const saved = {
        nameAr: data.name_ar || "",
        nameEn: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
      };

      setInfo(saved);
      return { info: saved, error: null };
    } catch (err) {
      console.error("Error saving business info:", err);
      return { error: err };
    } finally {
      setIsSaving(false);
    }
  }

  return {
    info,
    setInfo,
    isLoading,
    isSaving,
    error,
    saveInfo,
  };
}
