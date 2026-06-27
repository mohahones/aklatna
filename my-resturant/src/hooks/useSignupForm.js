import { useState } from "react";
import imageCompression from "browser-image-compression";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

const logoBucketName = "restaurant-logos";

const signupMessages = {
  checking: "جاري التحقق...",
  success: "تم إنشاء الحساب بنجاح!",
  invalidEmail: "البريد الإلكتروني غير صحيح",
  missingEmail: "البريد الإلكتروني مطلوب",
  missingPassword: "كلمة المرور مطلوبة",
  passwordTooShort: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  fixMissingFields: "يرجى ملء جميع الحقول المطلوبة",
  authUnavailable: "خدمة التحقق غير متاحة حالياً",
  emailExists: "هذا البريد الإلكتروني مسجل بالفعل",
};

export function useSignupForm({ onSuccess } = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function notify(nextMessage, nextStatus = "info") {
    setMessage(nextMessage);
    setStatus(nextStatus);
    window.clearTimeout(notify.timeoutId);
    notify.timeoutId = window.setTimeout(() => {
      setMessage("");
      setStatus("idle");
    }, 2600);
  }

  function normalizeOpeningHours(openingHours = []) {
    return openingHours.map((entry, index) => ({
      day: typeof entry.day === "number" ? entry.day : index,
      isOpen: Boolean(entry.isOpen),
      openTime: entry.openTime || null,
      closeTime: entry.closeTime || null,
    }));
  }

  async function compressLogo(file) {
    return imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      initialQuality: 0.8,
    });
  }

  function buildLogoPath(file) {
    const extension = file.type?.split("/")[1] || "jpg";
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `logos/${suffix}.${extension}`;
  }

  async function cleanupUploadedLogo(uploadedLogoPath) {
    if (!uploadedLogoPath) {
      return;
    }

    await supabase.storage.from(logoBucketName).remove([uploadedLogoPath]);
  }

  async function handleSignup(formData) {
    if (isSubmitting) return;

    const nextFieldErrors = {};

    // Validate all required fields
    if (!formData.email?.trim()) {
      nextFieldErrors.email = signupMessages.missingEmail;
    } else if (!formData.email.includes("@")) {
      nextFieldErrors.email = signupMessages.invalidEmail;
    }

    if (!formData.password?.trim()) {
      nextFieldErrors.password = signupMessages.missingPassword;
    } else if (formData.password.length < 6) {
      nextFieldErrors.password = signupMessages.passwordTooShort;
    }

    if (!formData.restaurantName?.trim()) {
      nextFieldErrors.restaurantName = "اسم المطعم مطلوب";
    }

    if (!formData.phone?.trim()) {
      nextFieldErrors.phone = "رقم الهاتف مطلوب";
    }

    if (!formData.address?.trim()) {
      nextFieldErrors.address = "عنوان العمل مطلوب";
    }

    if (!Array.isArray(formData.openingHours) || formData.openingHours.length === 0) {
      nextFieldErrors.openingHours = "حدد ساعات العمل الأسبوعية";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      notify(signupMessages.fixMissingFields, "error");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      notify(signupMessages.authUnavailable, "error");
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setStatus("loading");
    setMessage(signupMessages.checking);

    let uploadedLogoPath = "";
    let logoUrl = "";

   try {
      if (formData.logoFile instanceof File) {
        const compressedLogo = await compressLogo(formData.logoFile);
        uploadedLogoPath = buildLogoPath(compressedLogo);

        const { error: uploadError } = await supabase.storage.from(logoBucketName).upload(uploadedLogoPath, compressedLogo, {
          contentType: compressedLogo.type || formData.logoFile.type,
          upsert: false,
        });

        if (uploadError) {
          throw new Error(uploadError.message || "فشل رفع شعار المطعم إلى التخزين.");
        }

        const { data: publicData } = supabase.storage.from(logoBucketName).getPublicUrl(uploadedLogoPath);
        logoUrl = publicData.publicUrl;
      }

      // 1. الخطوة الأولى: إنشاء الحساب الأساسي بالإيميل والباسورد فقط (حذفنا كائن options)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: "restaurant",
            is_active: false,
          }
        }
      });

      if (signUpError) {
        await cleanupUploadedLogo(uploadedLogoPath);
        if (signUpError.message?.includes("already registered")) {
          notify(signupMessages.emailExists, "error");
        } else {
          notify(signUpError.message || "فشل إنشاء الحساب، يرجى المحاولة لاحقاً.", "error");
        }
        return;
      }

      // 💡 هنا نمسك الـ ID المخفي للعميل من الحساب الجديد فوراً
      const userId = data.user.id;

      // 2. الخطوة الثانية: إرسال معلومات المطعم لجدول الـ businesses وربطها بالـ ID المخفي
      const { error: businessError } = await supabase
        .from('businesses') 
        .insert({
          id: userId, // الـ id المخفي يوضع هنا لربط جدول المطاعم بالحساب الشخصي
          name_ar: formData.restaurantName || "",
          name:formData.restaurantNameEn?.trim() || "",
          phone: formData.phone || "",
          address: formData.address || "",
          logo_url: logoUrl,
          is_active: false
        });

      if (businessError) {
        throw new Error(businessError.message || "فشل حفظ بيانات المطعم.");
      }

      // 3. الخطوة الثالثة: تحضير مصفوفة الأيام وربط كل سطر بالـ ID المخفي للعميل
      const hoursToInsert = normalizeOpeningHours(formData.openingHours).map(dayRow => ({
        user_id: userId,          // عمود الربط الذي أنشأناه بالـ Supabase
        day_of_week: dayRow.day,  // يرسل رقم اليوم (0-6) لعمود day_of_week
        open_time: dayRow.openTime,
        close_time: dayRow.closeTime,
        is_closed: !dayRow.isOpen // إذا كان isOpen يساوي true فإن is_closed يكون false والعكس صحيح
      }));

      // 4. الخطوة الرابعة: إرسال الأيام الـ 7 دفعة واحدة لجدول ساعات العمل
      const { error: hoursError } = await supabase
        .from('restaurant_hours') 
        .insert(hoursToInsert);

      if (hoursError) {
        throw new Error(hoursError.message || "فشل حفظ ساعات العمل الأسبوعية.");
      }

      // نجاح العملية بالكامل وتخزينها بالجداول المنفصلة
      notify(signupMessages.success, "success");

      if (typeof onSuccess === "function") {
        onSuccess(data.user ?? null);
      }
    } catch (err) {
      await cleanupUploadedLogo(uploadedLogoPath);

      if (err instanceof Error && err.message) {
        notify(err.message, "error");
      } else {
        notify("حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isSubmitting,
    status,
    message,
    fieldErrors,
    handleSignup,
  };
}
