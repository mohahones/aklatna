import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import useBusinessAvatar from "../hooks/settings/useBusinessAvatar";

export default function RestaurantLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logoUrl, nameAr, initial } = useBusinessAvatar();

  return (
    <div className="min-h-screen bg-surface-bg flex">
      <div
        className={`fixed inset-y-0 right-0 z-50 w-[260px] bg-surface-container-lowest border-l border-border-subtle shadow-sm transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:block ${
          sidebarOpen ? "translate-x-0 max-[959px]:translate-x-0" : "max-[959px]:translate-x-full"
        }`}
      >
        <Sidebar onLogout={onLogout} />
      </div>

      <div
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } max-[959px]:block lg:hidden`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0">
        <header className="h-16 border-b border-border-subtle bg-surface sticky top-0 z-40 flex items-center px-6 justify-between">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-white text-on-surface shadow-sm transition hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary lg:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

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
