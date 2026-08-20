import { useNavigate, useLocation } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";

export function SidebarSection({  onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <aside className="flex h-dvh max-h-dvh w-[260px] flex-col overflow-y-auto bg-surface-container-lowest px-4 py-6 text-right">
      <div className="mb-10 px-2">
        <p className="text-xl font-bold text-primary">أكلاتنا</p>
        <p className="text-xs text-secondary opacity-70">لوحة الإدارة</p>
      </div>

      <nav className="flex-1 space-y-1">
        <button
          type="button"
          onClick={() => navigate("/cash-payment")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
            isActive("cash-payment")
              ? "bg-secondary-container font-bold text-on-secondary-container"
              : "text-secondary hover:bg-surface-container-low"
          }`}
        >
          <MaterialIcon name="payments" className="text-lg" filled />
          <span>الفواتير</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/subscriptions")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
            isActive("subscriptions")
              ? "bg-secondary-container font-bold text-on-secondary-container"
              : "text-secondary hover:bg-surface-container-low"
          }`}
        >
          <MaterialIcon name="subscriptions" className="text-lg" filled />
          <span>إدارة الاشتراكات</span>
        </button>
      </nav>

      <div className="mt-auto border-t border-border-subtle pt-6">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-error transition-colors hover:bg-error-container/20"
        >
          <MaterialIcon name="logout" className="text-lg" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
