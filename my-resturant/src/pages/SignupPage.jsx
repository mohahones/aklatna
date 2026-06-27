import SignupHero from "../components/auth/SignupHero";
import ProgressIndicator from "../components/auth/ProgressIndicator";
import SignupForm from "../components/auth/SignupForm";
import SignupFormStep2 from "../components/auth/SignupFormStep2";
import AuthToast from "../components/auth/AuthToast";
import { useState } from "react";
// ❌ قمنا بحذف الـ useSignupForm لأنه كان يرسل البيانات مبكراً
import { useSessionStorageState } from "../hooks/useSessionStorageState";
import { Link, useNavigate } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useSessionStorageState("auth-signup-current-step", 1);
  const [formDataStep1, setFormDataStep1] = useSessionStorageState("auth-signup-step1-confirmed", {});
  const [errors, setErrors] = useState({});

  // حالات محلية لعرض التنبيهات إذا لزم الأمر
  const [status] = useState("idle");
  const [message] = useState("");

  function handleStep1Submit(formData) {
    const nextErrors = {};

    if (!formData.restaurantName?.trim()) {
      nextErrors.restaurantName = "اسم المطعم مطلوب";
    }

    if (!formData.phone?.trim()) {
      nextErrors.phone = "رقم الهاتف مطلوب";
    }

    if (!formData.email?.trim()) {
      nextErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!formData.email.includes("@")) {
      nextErrors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!formData.address?.trim()) {
      nextErrors.address = "عنوان العمل مطلوب";
    }

    if (!formData.password?.trim()) {
      nextErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 6) {
      nextErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setFormDataStep1(formData);
    setErrors({});
    setCurrentStep(2);
  }

  // ⬇️ هنا التعديل الجوهري والذكي ⬇️
  function handleStep2Submit(step2Data) {
    // 1. تجميع كافة البيانات من الخطوتين معاً
    const allSignupData = {
      ...formDataStep1,
      ...step2Data,
    };

    // 2. تنظيف الـ sessionStorage المحلي للـ Signup
    window.sessionStorage.removeItem("auth-signup-current-step");
    window.sessionStorage.removeItem("auth-signup-step1-form");
    window.sessionStorage.removeItem("auth-signup-step1-confirmed");
    window.sessionStorage.removeItem("auth-signup-step2-hours");

    // 3. التوجيه لصفحة الـ account وشحن البيانات كاملة داخل الـ state!
    navigate("/account", {
      replace: true,
      state: { signupData: allSignupData }
    });
  }

  function handleBackToStep1() {
    setCurrentStep(1);
    setErrors({});
  }

  return (
    <div className="flex min-h-screen bg-surface-bg">
      <SignupHero />

      <main className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24">
        <div className="w-full max-w-[520px]">
          <div className="md:hidden mb-8">
            <h1 className="font-headline-md text-headline-md text-primary font-bold">بيسترو برو</h1>
            <p className="font-body-md text-body-md text-secondary">بوابة الشركاء</p>
          </div>

          <ProgressIndicator currentStep={currentStep} totalSteps={2} />

          <div className="space-y-2 mb-8">
            <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
              {currentStep === 1 ? "لنبدأ معاً" : "أكمل ملفك الشخصي"}
            </h2>
            <p className="font-body-md text-body-md text-secondary">
              {currentStep === 1
                ? "أدخل تفاصيل عملك لإنشاء حساب الشريك الخاص بك."
                : "أضف الشعار وساعات العمل الأسبوعية قبل إنشاء الحساب."}
            </p>
          </div>
          {currentStep === 1 ? (
            <SignupForm
              onSubmit={handleStep1Submit}
              isLoading={false}
              errors={errors}
            />
          ) : (
            <SignupFormStep2
              onSubmit={handleStep2Submit}
              onBack={handleBackToStep1}
              isLoading={false}
            />
          )}

          {currentStep === 1 && (
            <div className="mt-8 text-center">
              <p className="font-body-md text-body-md text-secondary">
                لديك حساب شريك بالفعل؟{" "}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  سجل دخولك هنا
                </Link>
              </p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="mt-12 pt-8 border-t border-border-subtle">
              <p className="font-label-sm text-label-sm text-secondary/60 text-center uppercase tracking-widest mb-6">
                موثوق من قبل رواد الصناعة
              </p>
              <div className="flex justify-center items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-300">
                <div className="h-6 w-24 bg-secondary/30 rounded-full"></div>
                <div className="h-6 w-24 bg-secondary/30 rounded-full"></div>
                <div className="h-6 w-24 bg-secondary/30 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {message && <AuthToast type={status} message={message} />}
    </div>
  );
}