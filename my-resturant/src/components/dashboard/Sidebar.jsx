import { NavLink } from "react-router-dom";

const navItems = [
  { icon: "dashboard", label: "لوحة التحكم", to: "/dashboard/overview" },
  { icon: "receipt_long", label: "الطلبات", to: "/dashboard/orders" },
  { icon: "restaurant_menu", label: "القائمة", to: "/dashboard/menu" },
  { icon: "layers", label: "الخطط", to: "/dashboard/plans" },
  { icon: "payments", label: "الفواتير", to: "/dashboard/billing" },
  { icon: "settings", label: "الإعدادات", to: "/dashboard/settings" },
];

export default function Sidebar() {
  return (
    <aside className="fixed right-0 top-0 h-full w-[260px] bg-surface-container-lowest border-l border-border-subtle shadow-sm flex flex-col py-6 px-4 z-50">
      <div className="mb-10 px-2 text-right">
        <h1 className="text-xl font-bold text-primary">بيسترو برو</h1>
        <p className="text-xs text-secondary opacity-70">بوابة الشركاء</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all active:scale-[0.98] ${
                isActive ? "bg-secondary-container text-on-secondary-container font-bold" : "text-secondary hover:bg-surface-container-low"
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-border-subtle">
        <button className="flex w-full items-center gap-3 px-3 py-2.5 text-error hover:bg-error-container/20 transition-colors rounded-lg">
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
