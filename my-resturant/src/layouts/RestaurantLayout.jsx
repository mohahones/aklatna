import { Outlet } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import useBusinessAvatar from "../hooks/settings/useBusinessAvatar";

export default function RestaurantLayout({ onLogout }) {
  const { logoUrl, nameAr, initial } = useBusinessAvatar();

  return (
    <div className="min-h-screen bg-surface-bg flex">
      <Sidebar onLogout={onLogout} />

      <main className="flex-1 mr-[260px] min-w-0">
        <header className="h-16 border-b border-border-subtle bg-surface sticky top-0 z-40 flex items-center px-6 justify-end">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 text-secondary hover:bg-surface-container-low rounded-full transition-colors relative"
              aria-label="الإشعارات"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
            </button>

            <div
              className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs overflow-hidden border border-border-subtle"
              title={nameAr || "المطعم"}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={nameAr || "شعار المطعم"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
