import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarSection } from "../components/CashPayment/SidebarSection";

export default function AdminLayout({ title, children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-surface-bg text-on-surface">
      <div className="flex min-h-dvh">
        <div
          className={`fixed inset-y-0 right-0 z-50 h-dvh w-[260px] overflow-hidden border-l border-border-subtle bg-surface-container-lowest shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <SidebarSection onLogout={onLogout} />
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1 lg:mr-[260px]">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border-subtle bg-surface px-6">
            <h1 className="text-sm font-semibold text-secondary">{title}</h1>
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-white text-on-surface shadow-sm transition hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary lg:hidden"
              aria-label={sidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
