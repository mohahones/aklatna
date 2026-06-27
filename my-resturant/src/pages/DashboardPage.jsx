import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

const weekDays = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];

export default function DashboardPage({ currentUser, onLogout }) {
  const [openingHours, setOpeningHours] = useState([]);
  const [isHoursLoading, setIsHoursLoading] = useState(false);
  const [hoursError, setHoursError] = useState("");

  const stats = [
    { label: "الطلبات النشطة", value: "18" },
    { label: "المتاجر المرتبطة", value: "42" },
    { label: "التحديثات اليوم", value: "7" },
  ];

  useEffect(() => {
    let isActive = true;

    async function loadOpeningHours() {
      if (!currentUser?.id) {
        setOpeningHours([]);
        setHoursError("تعذر العثور على الحساب الحالي.");
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        setOpeningHours([]);
        setHoursError("خدمة البيانات غير مهيأة حالياً.");
        return;
      }

      setIsHoursLoading(true);
      setHoursError("");

      const { data, error } = await supabase
        .from("restaurant_hours")
        .select("day_of_week, open_time, close_time, is_closed")
        .eq("user_id", currentUser.id)
        .order("day_of_week", { ascending: true });

      if (!isActive) {
        return;
      }

      if (error) {
        setOpeningHours([]);
        setHoursError(error.message || "فشل تحميل ساعات العمل.");
      } else {
        setOpeningHours(data ?? []);
      }

      setIsHoursLoading(false);
    }

    loadOpeningHours();

    return () => {
      isActive = false;
    };
  }, [currentUser?.id]);

  return (
    <div className="min-h-screen bg-surface-bg px-4 py-6 sm:px-6">
      <main className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl flex-col justify-center gap-6">
        <section className="overflow-hidden rounded-3xl border border-border-subtle bg-surface-container-lowest p-6 shadow-lg sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 text-right">
              <p className="font-label-sm text-label-sm text-secondary">لوحة التحكم</p>
              <h1 className="font-display-lg text-display-lg text-on-surface max-sm:text-display-lg-mobile">
                مرحباً بك في أكلاتنا
              </h1>
              <p className="font-body-md text-body-md text-secondary">
                لقد تم التحقق من البريد الإلكتروني وكلمة المرور بنجاح.
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-border-subtle bg-surface-container-low px-4 py-2 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container"
            >
              تسجيل الخروج
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-border-subtle bg-surface-container-low p-5 text-right"
              >
                <p className="font-label-sm text-label-sm text-secondary">{stat.label}</p>
                <p className="mt-3 font-display-lg text-display-lg text-on-surface">{stat.value}</p>
              </article>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border border-border-subtle bg-surface-container-low p-5 text-right">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface">ساعات العمل الأسبوعية</h2>
              <p className="font-label-sm text-label-sm text-secondary">
                {isHoursLoading ? "جاري التحميل..." : "تم جلب البيانات من قاعدة البيانات"}
              </p>
            </div>

            {hoursError ? <p className="mt-4 font-label-sm text-label-sm text-error">{hoursError}</p> : null}

            {!hoursError ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {weekDays.map((dayName, index) => {
                  const dayRecord = openingHours.find((entry) => entry.day_of_week === index);
                  const isClosed = !dayRecord || dayRecord.is_closed;

                  return (
                    <article key={dayName} className="rounded-xl border border-border-subtle bg-surface-container-lowest p-4">
                      <p className="font-label-sm text-label-sm text-secondary">{dayName}</p>
                      <p className="mt-2 font-body-lg text-body-lg text-on-surface">
                        {isClosed
                          ? "مغلق"
                          : `${dayRecord.open_time ?? "--:--"} - ${dayRecord.close_time ?? "--:--"}`}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        </section>
      </main>
    </div>
  );
}