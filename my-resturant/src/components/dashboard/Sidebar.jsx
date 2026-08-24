import { NavLink } from "react-router-dom";
import { secondaryLinks } from "../../data/loginContent";
import { getSupportHref } from "../../utils/supportLink";

const navItems = [
  { icon: "dashboard", label: "لوحة التحكم", to: "overview" },
  { icon: "receipt_long", label: "الطلبات", to: "orders" },
  { icon: "campaign", label: "الوظائف", to: "jobs" },
  { icon: "restaurant_menu", label: "القائمة", to: "menu" },
  { icon: "local_offer", label: "العروض", to: "offers" },
  { icon: "settings", label: "الإعدادات", to: "settings" },
];

export default function Sidebar({ onLogout }) {
  const supportLink = secondaryLinks[0];
  const supportHref = getSupportHref(supportLink);

  return (
    <aside className="h-dvh max-h-dvh w-[260px] overflow-y-auto bg-surface-container-lowest border-l border-border-subtle shadow-sm flex flex-col py-6 px-4">
      <div className="mb-10 px-2 text-right">
        <h1 className="text-xl font-bold text-primary">أكلاتنا</h1>
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
        <a
          href={supportHref}
          target={supportHref.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-secondary transition-colors hover:bg-surface-container-low hover:text-on-surface"
        >
          <span className="material-symbols-outlined">support_agent</span>
          <span className="text-sm">{supportLink.label}</span>
        </a>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-error hover:bg-error-container/20 transition-colors rounded-lg"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
