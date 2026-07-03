import MaterialIcon from "../ui/MaterialIcon";

export function SidebarSection({  onLogout }) {
  return (
    <aside className="w-full bg-sidebar-bg px-6 py-8 text-sidebar-text lg:w-[260px] lg:shrink-0">
      <div className="mb-8">
        <p className="text-xl font-bold text-black">لوحة التحكم</p>
      </div>

      <nav className="space-y-2">
        <div className="flex items-center gap-3 rounded-lg bg-primary-container px-4 py-3 text-sm font-medium text-white">
          <MaterialIcon name="payments" className="text-lg" filled />
          <span>الفواتير</span>
        </div>
      </nav>

      <div className="mt-6 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white lg:text-black transition hover:bg-white/10"
        >
          <MaterialIcon name="logout" className="text-lg" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
