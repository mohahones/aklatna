import { useState } from "react";
import { useLocation } from "react-router-dom";
import MaterialIcon from "../components/ui/MaterialIcon";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

export default function AccountPage({ currentUser }) {
    const location = useLocation();
    const signupData = location.state?.signupData;
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");

    async function handleSubscribe() {
        if (!isSupabaseConfigured || !supabase) {
            setSubmitMessage("خدمة Supabase غير متاحة حالياً");
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage("");

        try {
            if (!signupData?.email || !signupData?.password) {
                throw new Error("بيانات التسجيل غير متوفرة.");
            }

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: signupData.email,
                password: signupData.password,
                options: {
                    data: {
                        role: "restaurant",
                        restaurantName: signupData.restaurantName || "",
                        phone: signupData.phone || "",
                        address: signupData.address || "",
                        is_active: false,
                    },
                },
            });

            if (signUpError) {
                throw new Error(signUpError.message || "فشل إنشاء الحساب");
            }

            const userId = authData?.user?.id;
            if (!userId) {
                throw new Error("لم يتم إنشاء المستخدم بنجاح.");
            }

            const restaurantName = signupData.restaurantName || currentUser?.user_metadata?.restaurantName || currentUser?.user_metadata?.business_name || signupData.email || "مطعم غير مسجل";
            const address = signupData.address || currentUser?.user_metadata?.address || "";
            const phone = signupData.phone || currentUser?.user_metadata?.phone || "";
            const openingHours = signupData?.openingHours || [];
            const orderDate = new Date().toISOString();

            const { error: businessError } = await supabase
                .from("businesses")
                .insert(
                    {
                        id: userId,
                        name_ar: restaurantName,
                        name: restaurantName,
                        phone,
                        address,
                        created_at: orderDate,
                        is_active: false,
                    },
                    { onConflict: "id" }
                );

            if (businessError) {
                throw new Error(businessError.message || "فشل إرسال الطلب إلى Supabase");
            }

            const daysMapping = [
                { name: "الإثنين", index: 1 },
                { name: "الثلاثاء", index: 2 },
                { name: "الأربعاء", index: 3 },
                { name: "الخميس", index: 4 },
                { name: "الجمعة", index: 5 },
                { name: "السبت", index: 6 },
                { name: "الأحد", index: 7 }
            ];

            const restaurantHoursRows = daysMapping.map(({ name, index }) => {
                const dayEntry = openingHours?.find((entry) => entry.day === name);

                return {
                    user_id: userId,
                    // هنا قمنا بالحل: نرسل الرقم (index)، وإذا كان العمود نصاً سيقبله كـ "1"
                    day_of_week: index,
                    open_time: dayEntry?.isOpen ? dayEntry.openTime : null,
                    close_time: dayEntry?.isOpen ? dayEntry.closeTime : null,
                    is_closed: dayEntry ? !dayEntry.isOpen : true
                };
            });

            const { error: hoursError } = await supabase.from("restaurant_hours").insert(restaurantHoursRows);

            if (hoursError) {
                throw new Error(hoursError.message || "فشل حفظ ساعات العمل");
            }

            setIsSubmitted(true);
            setSubmitMessage("تم إرسال الطلب بنجاح");
        } catch (error) {
            setIsSubmitted(false);
            setSubmitMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
        } finally {
            setIsSubmitting(false);
        }
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

                        {submitMessage ? (
                            <p className={`mt-3 text-sm font-medium ${isSubmitted ? "text-success-green" : "text-error-red"}`}>
                                {submitMessage}
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
