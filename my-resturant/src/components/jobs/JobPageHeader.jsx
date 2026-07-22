import React from "react";

export default function JobPageHeader({ onAddJob }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-8 px-6">
      <div>
        <h2 className="text-display-lg font-display-lg text-on-surface">إدارة الوظائف المنشورة</h2>
        <p className="text-body-md text-secondary mt-1">تابع حالة التوظيف وقم بتحديث الوظائف الشاغرة</p>
      </div>

      <div className="flex items-center gap-3 w-auto">
        <button
          type="button"
          onClick={onAddJob}
          className="bg-primary-container hover:bg-primary text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary-container/20 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">add</span>
          <span>إضافة وظيفة جديدة</span>
        </button>
      </div>
    </div>
  );
}
