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
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorType, setErrorType] = useState(""); // نوع الخطأ المحدد
  const [errorStep, setErrorStep] = useState(""); // الخطوة التي حدث فيها الخطأ
  const [errorDetails, setErrorDetails] = useState(null); // تفاصيل إضافية للخطأ

  function notify(nextMessage, nextStatus = "info") {
    setMessage(nextMessage);
    setStatus(nextStatus);
    window.clearTimeout(notify.timeoutId);
    notify.timeoutId = window.setTimeout(() => {
      setMessage("");
      setStatus("idle");
    }, 2600);
  }

  function notifyError(errorMsg, type = "general", step = "", details = null) {
    setMessage(errorMsg);
    setStatus("error");
    setErrorType(type);
    setErrorStep(step);
    setErrorDetails(details);
    console.error(`❌ خطأ [${type}] في الخطوة: ${step}`, { errorMsg, details });
    window.clearTimeout(notify.timeoutId);
    notify.timeoutId = window.setTimeout(() => {
      setMessage("");
      setStatus("idle");
      setErrorType("");
      setErrorStep("");
      setErrorDetails(null);
    }, 3500);
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

  function buildCoverPath(file) {
    const extension = file.type?.split("/")[1] || "jpg";
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `covers/${suffix}.${extension}`;
  }

  async function compressCover(file) {
    return imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8,
    });
  }

  async function cleanupUploadedLogo(uploadedLogoPath) {
    if (!uploadedLogoPath) {
      return;
    }

    await supabase.storage.from(logoBucketName).remove([uploadedLogoPath]);
  }

  async function cleanupUploadedCover(uploadedCoverPath) {
    if (!uploadedCoverPath) {
      return;
    }

    await supabase.storage.from(logoBucketName).remove([uploadedCoverPath]);
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

    if (!formData.passwordConfirm?.trim()) {
      nextFieldErrors.passwordConfirm = "تأكيد كلمة المرور مطلوب";
    } else if (formData.passwordConfirm !== formData.password) {
      nextFieldErrors.passwordConfirm = "كلمات المرور غير متطابقة";
    }

    if (!formData.restaurantName?.trim()) {
      nextFieldErrors.restaurantName = "اسم المطعم مطلوب";
    }

    if (!formData.restaurantNameEn?.trim()) {
      nextFieldErrors.restaurantNameEn = "اسم المطعم بالإنجليزية مطلوب";
    }

    if (!formData.businessType?.trim()) {
      nextFieldErrors.businessType = "نوع المشروع مطلوب";
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
      notifyError(signupMessages.fixMissingFields, "validation_error", "التحقق من البيانات", nextFieldErrors);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      notifyError(signupMessages.authUnavailable, "supabase_unavailable", "تهيئة النظام");
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setStatus("loading");
    setMessage(signupMessages.checking);

    let uploadedLogoPath = "";
    let logoUrl = "";
    let uploadedCoverPath = "";
    let coverUrl = "";

   try {
      // =============== المرحلة 2: رفع الصور إلى Storage ===============
      if (formData.logoFile instanceof File) {
        const compressedLogo = await compressLogo(formData.logoFile);
        uploadedLogoPath = buildLogoPath(compressedLogo);

        const { error: uploadError } = await supabase.storage.from(logoBucketName).upload(uploadedLogoPath, compressedLogo, {
          contentType: compressedLogo.type || formData.logoFile.type,
          upsert: false,
        });

        if (uploadError) {
          throw {
            type: "logo_upload_failed",
            step: "رفع الشعار",
            message: `فشل رفع شعار المطعم: ${uploadError.message}`,
            details: uploadError
          };
        }

        const { data: publicData } = supabase.storage.from(logoBucketName).getPublicUrl(uploadedLogoPath);
        logoUrl = publicData.publicUrl;
      }

      if (formData.coverFile instanceof File) {
        const compressedCover = await compressCover(formData.coverFile);
        uploadedCoverPath = buildCoverPath(compressedCover);

        const { error: uploadError } = await supabase.storage.from(logoBucketName).upload(uploadedCoverPath, compressedCover, {
          contentType: compressedCover.type || formData.coverFile.type,
          upsert: false,
        });

        if (uploadError) {
          throw {
            type: "cover_upload_failed",
            step: "رفع صورة الغلاف",
            message: `فشل رفع صورة الغلاف: ${uploadError.message}`,
            details: uploadError
          };
        }

        const { data: publicData } = supabase.storage.from(logoBucketName).getPublicUrl(uploadedCoverPath);
        coverUrl = publicData.publicUrl;
      }

      // =============== المرحلة 3: تحضير بيانات ساعات العمل ===============
      const hoursToInsert = normalizeOpeningHours(formData.openingHours).map(dayRow => ({
        day_of_week: dayRow.day,
        open_time: dayRow.openTime,
        close_time: dayRow.closeTime,
        is_closed: !dayRow.isOpen
      }));

      // =============== المرحلة 4: Dry Run - التحقق من البيانات قبل إنشاء Auth ===============
      const { error: dryRunError } = await supabase.rpc(
        'register_business_with_hours',
        {
          p_user_id: "00000000-0000-0000-0000-000000000000",
          p_name: formData.restaurantNameEn?.trim() || "",
          p_name_ar: formData.restaurantName || "",
          p_phone: formData.phone || "",
          p_address: formData.address || "",
          p_logo_url: logoUrl || null,
          p_cover_url: coverUrl || null,
          p_created_at: new Date().toISOString(),
          p_business_type: formData.businessType || "restaurant",
          p_hours: hoursToInsert,
          p_is_dry_run: true
        }
      );

      if (dryRunError) {
        throw {
          type: "dry_run_validation_failed",
          step: "التحقق من صحة البيانات",
          message: `فشل التحقق من البيانات: ${dryRunError.message}`,
          details: dryRunError
        };
      }

      // ✅ الدالة RETURNS VOID — إذا لا error = نجح التحقق

      // =============== المرحلة 5: إنشاء Auth **فقط بعد التأكد من البيانات** ===============
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
        let authErrorMsg = signUpError.message || "فشل إنشاء الحساب";
        if (signUpError.message?.includes("already registered")) {
          authErrorMsg = "هذا البريد الإلكتروني مسجل بالفعل في النظام";
        }
        throw {
          type: "auth_signup_failed",
          step: "إنشاء حساب المستخدم",
          message: authErrorMsg,
          details: signUpError
        };
      }

      const userId = data.user?.id;
      if (!userId) {
        throw {
          type: "auth_no_user_id",
          step: "إنشاء حساب المستخدم",
          message: "لم يتم الحصول على معرف المستخدم من النظام",
          details: { user: data.user }
        };
      }

      // =============== المرحلة 6: الإدراج الفعلي للبيانات ===============
      const { error: insertError } = await supabase.rpc(
        'register_business_with_hours',
        {
          p_user_id: userId,
          p_name: formData.restaurantNameEn?.trim() || "",
          p_name_ar: formData.restaurantName || "",
          p_phone: formData.phone || "",
          p_address: formData.address || "",
          p_logo_url: logoUrl || null,
          p_cover_url: coverUrl || null,
          p_created_at: new Date().toISOString(),
          p_business_type: formData.businessType || "restaurant",
          p_hours: hoursToInsert,
          p_is_dry_run: false
        }
      );

      if (insertError) {
        throw {
          type: "database_insert_failed",
          step: "حفظ البيانات في قاعدة البيانات",
          message: `فشل حفظ البيانات: ${insertError.message}`,
          details: insertError
        };
      }

      // ✅ الدالة RETURNS VOID — إذا لا error = نجح الإدراج

      // =============== نجاح العملية بالكامل ===============
      notify(signupMessages.success, "success");

      if (typeof onSuccess === "function") {
        onSuccess(data.user ?? null);
      }
    } catch (err) {
      await cleanupUploadedLogo(uploadedLogoPath);
      await cleanupUploadedCover(uploadedCoverPath);

      // معالجة الأخطاء المحددة
      if (err.type && err.step) {
        notifyError(err.message, err.type, err.step, err.details);
      } else if (err instanceof Error && err.message) {
        notifyError(err.message, "unknown_error", "عملية غير معروفة");
      } else {
        notifyError("حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.", "unexpected_error", "نظام");
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
    errorType,
    errorStep,
    errorDetails,
    handleSignup,
  };
}
