import MaterialIcon from "../components/ui/MaterialIcon";

export default function WaitingPage({ onLogout }) {

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-bg px-4 py-8 text-on-surface antialiased sm:px-6 lg:px-8">
      <main className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col items-center justify-center">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
          <div className="absolute right-[-8%] top-[-8%] h-[36%] w-[36%] rounded-full bg-primary blur-[140px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[36%] w-[36%] rounded-full bg-tertiary blur-[140px]" />
        </div>

        <div className="flex w-full justify-center px-2 sm:px-4 lg:px-6">
          <div className="relative w-full max-w-xl rounded-[28px] border border-primary/10 bg-white/85 p-8 shadow-[0_24px_80px_-24px_rgba(174,50,0,0.28)] backdrop-blur-xl sm:p-10">
            
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 animate-pulse">
                <MaterialIcon name="schedule" className="text-6xl text-primary" />
              </div>
              
              <h1 className="mb-4 font-display-lg text-3xl text-on-surface">
                حسابك قيد المراجعة
              </h1>
              
              <p className="mb-8 max-w-md font-body-md text-body-md text-secondary">
                سيتم مراجعة بيانات مطعمك والتحقق من المعلومات. سيتم الرد عليك خلال 24 ساعة عبر البريد الإلكتروني.
              </p>
            </div>

            <div className="mb-8 space-y-4 rounded-lg bg-primary-fixed p-6">
              <div className="flex items-start gap-3">
                <MaterialIcon name="check_circle" className="mt-1 text-2xl text-success-green flex-shrink-0" />
                <div className="text-right">
                  <p className="font-bold text-on-primary-fixed">تم استلام طلبك بنجاح</p>
                  <p className="text-sm text-on-primary-fixed/80">ستتلقى تأكيداً عبر البريد الإلكتروني</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MaterialIcon name="hourglass_bottom" className="mt-1 text-2xl text-primary flex-shrink-0" />
                <div className="text-right">
                  <p className="font-bold text-on-primary-fixed">في انتظار التفعيل</p>
                  <p className="text-sm text-on-primary-fixed/80">سيتم تفعيل حسابك بعد المراجعة</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MaterialIcon name="verified_user" className="mt-1 text-2xl text-primary flex-shrink-0" />
                <div className="text-right">
                  <p className="font-bold text-on-primary-fixed">معلومات آمنة</p>
                  <p className="text-sm text-on-primary-fixed/80">بيانات مطعمك محفوظة بأمان</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-xl border-2 border-primary px-4 py-4 text-lg font-bold text-primary transition-all duration-200 hover:bg-primary/5 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>تسجيل الخروج</span>
                <MaterialIcon name="logout" className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
