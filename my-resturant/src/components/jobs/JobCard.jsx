import React, { useState, useEffect, useRef } from "react";

export default function JobCard({ job, onToggleStatus, onEdit, onDelete, onRepublish }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isPending = job.status === "pending";
  const isClosed = job.status === "closed";
  const isApproved = job.isApproved ?? job.status !== "pending";
  const isActive = job.isActive ?? job.status === "active";
  const canRepublish = isApproved && !isActive;
  const isRepublishDisabled = !canRepublish;

  const handleMenuToggle = () => setIsMenuOpen((current) => !current);
  const handleEdit = () => {
    setIsMenuOpen(false);
    onEdit?.(job.raw ?? job);
  };
  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete?.(job);
  };
  const handleRepublish = () => {
    if (isRepublishDisabled) return;
    setIsMenuOpen(false);
    onRepublish?.(job);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div
      className={`bg-surface-container-lowest border border-border-subtle rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-visible ${
        isMenuOpen ? "z-50" : ""
      } ${isClosed ? "opacity-80" : ""}`}
    >
      <div className={`absolute right-0 top-0 bottom-0 w-1 ${isClosed ? "bg-secondary" : isPending ? "bg-pending-amber" : "bg-success-green"}`} />

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h4 className={`text-headline-md font-headline-md ${isClosed ? "text-secondary" : ""}`}>{job.title}</h4>
          <span
            className={`px-3 py-1 ${isClosed ? "bg-surface-container-highest text-secondary" : isPending ? "bg-pending-amber/10 text-pending-amber" : "bg-green-50 text-success-green"} text-[12px] font-bold rounded-full`}
          >
            {isClosed ? "مغلق" : isPending ? "قيد المراجعة" : "نشط"}
          </span>
        </div>
        <p className="text-body-md text-secondary mb-2">{job.restaurant}</p>
        <div className="flex flex-wrap gap-4 text-secondary text-sm">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">phone</span>
            <span dir="ltr">{job.phone}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            <span>{job.posted}</span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-3 w-full md:w-auto">
        <button
          type="button"
          onClick={() => onToggleStatus(job.id)}
          disabled={isClosed || isPending}
          className={`flex-1 md:flex-none ${
            isClosed
              ? "bg-surface-container-highest text-secondary cursor-not-allowed"
              : isPending
              ? "bg-pending-amber/10 text-pending-amber cursor-not-allowed"
              : "border-2 border-primary-container text-primary-container hover:bg-primary-container hover:text-white"
          } px-5 py-2.5 rounded-xl font-semibold transition-all text-sm`}
        >
          {isClosed ? "تم التوظيف بنجاح" : isPending ? "جاري المراجعة" : "تم قبول موظف"}
        </button>

        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={handleMenuToggle}
            className="p-2 rounded-xl border border-border-subtle text-secondary hover:bg-surface-container-low transition-all"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>

          {isMenuOpen && (
            <div className="absolute left-full top-0 ml-2 z-50 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2">
              <button
                type="button"
                onClick={handleEdit}
                className="w-full text-right px-4 py-3 text-sm text-on-surface hover:bg-surface-container-highest"
              >
                تعديل الوظيفة
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full text-right px-4 py-3 text-sm text-error-red hover:bg-surface-container-highest"
              >
                حذف الوظيفة
              </button>
              <button
                type="button"
                onClick={handleRepublish}
                disabled={isRepublishDisabled}
                className={`w-full text-right px-4 py-3 text-sm ${
                  isRepublishDisabled
                    ? "text-secondary cursor-not-allowed bg-surface-container-highest"
                    : "text-primary-container hover:bg-surface-container-highest"
                }`}
              >
                إعادة نشر الوظيفة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
