import { useState } from "react";
import { SidebarSection } from "../components/CashPayment/SidebarSection";

export default function AdminLayout({ title, children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <div
          className={`fixed inset-y-0 right-0 z-30 w-full sm:w-80 lg:relative lg:z-auto lg:w-auto lg:translate-x-0 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
        >
          <SidebarSection onLogout={onLogout} />
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 px-4 py-6 pt-8 sm:px-6 lg:pt-6 lg:px-8">
          <div className="lg:hidden mb-4 flex items-center justify-between rounded-2xl border border-border-subtle bg-white/95 p-4 shadow-sm">
            <h1 className="text-lg font-semibold text-on-surface">{title}</h1>
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-white text-on-surface shadow-sm transition hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={sidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {sidebarOpen ? (
                  <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <>
                    <path d="M5 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M5 17H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
