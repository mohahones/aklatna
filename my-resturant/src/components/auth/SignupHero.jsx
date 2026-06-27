import MaterialIcon from "../ui/MaterialIcon";

export default function SignupHero() {
  return (
    <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary relative overflow-hidden flex-col justify-between p-12 text-on-primary">
      <div className="relative z-10">
        <h1 className="font-display-lg text-display-lg font-extrabold tracking-tight">أكلاتنا</h1>
        <p className="font-body-lg text-body-lg mt-2 opacity-90">بوابة الشركاء</p>
      </div>

      <div className="relative z-10 max-w-lg">
        <h2 className="font-display-lg text-display-lg mb-6">قم بتمكين مطعمك من خلال رؤى مدعومة بالبيانات.</h2>
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0">
            <MaterialIcon name="trending_up" className="text-white text-2xl" />
          </div>
          <p className="font-body-md text-body-md">
            انضم إلى أكثر من 5,000 شريك مطعم زادوا إيراداتهم بنسبة 25% في عامهم الأول مع بيسترو برو.
          </p>
        </div>
      </div>

      <div className="relative z-10 font-label-sm text-label-sm opacity-60">© 2026 أكلاتنا جميع الحقوق محفوظة.</div>
    </div>
  );
}
