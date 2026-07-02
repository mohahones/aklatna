import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MaterialIcon from "../components/ui/MaterialIcon";
import { useSignupForm } from "../hooks/useSignupForm";

export default function AccountPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const signupData = location.state?.signupData;
    const { isSubmitting, status, message, handleSignup } = useSignupForm({
        onSuccess: () => {
            setIsSubmitted(true);
            window.sessionStorage.removeItem("auth-signup-current-step");
            window.sessionStorage.removeItem("auth-signup-step1-form");
            window.sessionStorage.removeItem("auth-signup-step1-confirmed");
            window.sessionStorage.removeItem("auth-signup-step2-hours");
            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 2000);
        },
    });
    const [submitMessage, setSubmitMessage] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    function handleSubscribe() {
        if (!signupData) {
            setSubmitMessage("بيانات التسجيل غير متوفرة.");
            return;
        }

        // إرسال كل البيانات للـ useSignupForm
        handleSignup(signupData);
    }

    return (
        <div className="min-h-screen overflow-x-hidden bg-surface-bg px-4 py-8 text-on-surface antialiased sm:px-6 lg:px-8">
            <main className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col items-center justify-center">
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
                    <div className="absolute right-[-8%] top-[-8%] h-[36%] w-[36%] rounded-full bg-primary blur-[140px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] h-[36%] w-[36%] rounded-full bg-tertiary blur-[140px]" />
                </div>

                <div className="mb-10 max-w-2xl text-center">
                    <h1 className="mb-4 font-display-lg text-display-lg-mobile text-primary md:text-display-lg">
                        عزز كفاءة مطبخك مع أكلاتنا
                    </h1>
                    <p className="font-body-lg text-body-lg text-secondary">
                        وسّع نطاق عملك وضاعف مبيعاتك، ابدأ اليوم بخطة بسيطة وفعالة.
                    </p>
                </div>

                <div className="flex w-full justify-center px-2 sm:px-4 lg:px-6">
                    <div className="relative w-full max-w-xl rounded-[28px] border border-primary/10 bg-white/85 p-8 shadow-[0_24px_80px_-24px_rgba(174,50,0,0.28)] backdrop-blur-xl sm:p-10">
                        <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center rounded-full bg-primary px-6 py-1.5 text-sm font-bold text-on-primary shadow-[0_10px_28px_-12px_rgba(174,50,0,0.6)]">
                            الخطة الشهرية
                        </div>

                        <div className="mb-6 text-center">
                            <p className="mb-2 block text-sm font-bold uppercase tracking-[0.2em] text-primary">
                                أفضل قيمة لمطعمك
                            </p>
                            <h2 className="font-headline-md text-3xl text-on-surface">العضوية الشاملة</h2>
                        </div>

                        <div className="mb-8 text-center">
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-6xl font-extrabold text-on-surface">10$</span>
                                <span className="font-body-md text-body-md text-secondary">/شهرياً</span>
                            </div>
                        </div>

                        {signupData && (
                            <div className="mb-8 rounded-lg bg-primary-fixed p-4 text-right">
                                <h3 className="mb-4 font-headline-sm text-headline-sm text-on-primary-fixed">بيانات مطعمك</h3>
                                <div className="space-y-2 text-sm font-body-sm">
                                    <p><strong>الاسم (العربي):</strong> {signupData.restaurantName}</p>
                                    <p><strong>الاسم (الإنجليزي):</strong> {signupData.restaurantNameEn}</p>
                                    <p><strong>النوع:</strong> {signupData.businessType === 'restaurant' ? 'مطعم' : 'محل عصير'}</p>
                                    <p><strong>البريد الإلكتروني:</strong> {signupData.email}</p>
                                    <p><strong>الهاتف:</strong> {signupData.phone}</p>
                                    <p><strong>العنوان:</strong> {signupData.address}</p>
                                </div>
                            </div>
                        )}

                        <div className="mb-8 space-y-4">
                            {[
                                "طلبات غير محدودة",
                                "دعم فني ذو أولوية 24/7",
                                "هوية قائمة مخصصة",
                                "إدارة المخزون المتقدمة",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3">
                                    <MaterialIcon name="check_circle" className="text-success-green" />
                                    <span className="font-body-md text-body-md">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mb-8 rounded-xl border border-primary/20 bg-primary-fixed px-4 py-4 text-center">
                            <p className="flex items-center justify-center gap-2 font-body-md text-body-md font-semibold text-on-primary-fixed-variant">
                                <MaterialIcon name="payments" className="text-lg" />
                                سيتم التواصل معك لتأكيد الدفع نقداً
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubscribe}
                            disabled={isSubmitting}
                            className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-4 text-lg font-bold text-white shadow-[0_14px_24px_-12px_rgba(255,90,31,0.5)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <span>{isSubmitting ? "جاري الإرسال..." : isSubmitted ? "تم الاشتراك بنجاح" : "اشترك الآن"}</span>
                            <MaterialIcon name={isSubmitting ? "hourglass_top" : isSubmitted ? "check_circle" : "arrow_back"} className="text-xl" />
                        </button>

                        {submitMessage || message ? (
                            <p className={`mt-3 text-sm font-medium ${isSubmitted || status === "success" ? "text-success-green" : "text-error-red"}`}>
                                {submitMessage || message}
                            </p>
                        ) : null}

                        <div
                            className={`absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[28px] bg-surface p-8 text-center transition-all duration-500 ${isSubmitted ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
                        >
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                                <MaterialIcon name="schedule" className="text-5xl text-primary" />
                            </div>
                            <h3 className="mb-4 font-display-lg text-2xl text-on-surface">طلبك قيد المراجعة</h3>
                            <p className="mb-8 max-w-md font-body-md text-body-md text-secondary">
                                سيتم الرد خلال 24 ساعة. شكراً لثقتك ببيسترو برو.
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsSubmitted(false)}
                                className="w-full rounded-xl border-2 border-primary px-4 py-3 font-bold text-primary transition-colors hover:bg-primary/5"
                            >
                                العودة للرئيسية
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-14 grid w-full max-w-5xl gap-8 border-t border-border-subtle pt-10 text-right md:grid-cols-2">
                    <div>
                        <h4 className="mb-2 font-headline-md text-headline-md">شفافية تامة</h4>
                        <p className="font-body-md text-body-md text-secondary">
                            لا توجد رسوم خفية أو تكاليف إضافية عند تفعيل اشتراكك. نلتزم بدعم نمو مطعمك بكل إخلاص.
                        </p>
                    </div>
                    <div className="flex items-center justify-center md:justify-end">
                        <img
                            alt="أمان وشفافية"
                            className="h-auto w-40 opacity-40 grayscale"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsin_-rt7HyqXNcZ_JCyzBmsWwMzbOm_j3XYzQ-3fblMbDTkr_9Jc9hFu3qJVFfckhmmodP8XvGc1aW13n9UcMETuOCBuxZ2whYH4OmsTmlFr3I0Emt7hYRsPFs5vp_he-e830_-5izNdRVEIkn3RmE0xC5Kn-TOfTJnoHleA9R4q6--6sKCc5MGt7NHGZg-JBVbaHgHiFyg373oFUIh60dcT1LbH5YND0RahgLLy5TNaLr2_WbrY4pejNfi5qvBb53-JYa9rITQ"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
