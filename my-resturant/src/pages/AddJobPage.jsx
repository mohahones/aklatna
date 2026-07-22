import { useNavigate, useLocation } from "react-router-dom";
import JobAddForm from "../components/jobs/JobAddForm";

export default function AddJobPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const jobToEdit = location.state?.jobToEdit || null;

  return (
    <div className="p-8 min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-8 px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/jobs")}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
            <span className="text-sm font-medium">العودة للوظائف</span>
          </button>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">خطوة 1 من 1</span>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-border-subtle overflow-hidden mx-6">
        <div className="h-32 bg-primary-fixed relative overflow-hidden">
          <div className="relative z-10 p-8 flex items-center justify-between h-full">
            <div>
              <h3 className="text-on-primary-fixed font-bold text-xl">تفاصيل الوظيفة</h3>
              <p className="text-on-primary-fixed-variant text-sm mt-1">أدخل المعلومات المطلوبة لجذب أفضل الكفاءات لمطعمك</p>
            </div>
            <div className="w-16 h-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-primary text-3xl">work_outline</span>
            </div>
          </div>
        </div>

        <JobAddForm initialJob={jobToEdit} />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
        <div className="bg-white p-6 rounded-2xl border border-border-subtle flex gap-4 items-start shadow-sm">
          <div className="w-10 h-10 rounded-full bg-pending-amber/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-pending-amber">lightbulb</span>
          </div>
          <div>
            <h4 className="font-bold text-sm">نصيحة للمنشأة</h4>
            <p className="text-xs text-secondary mt-1 leading-relaxed">استخدم مسميات وظيفية واضحة لجذب المرشحين المناسبين بسرعة أكبر.</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-border-subtle flex gap-4 items-start shadow-sm">
          <div className="w-10 h-10 rounded-full bg-success-green/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-success-green">verified</span>
          </div>
          <div>
            <h4 className="font-bold text-sm">التوثيق</h4>
            <p className="text-xs text-secondary mt-1 leading-relaxed">جميع الوظائف تخضع للمراجعة خلال 24 ساعة قبل ظهورها للباحثين عن عمل.</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-border-subtle flex gap-4 items-start shadow-sm">
          <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-tertiary">support_agent</span>
          </div>
          <div>
            <h4 className="font-bold text-sm">هل تحتاج مساعدة؟</h4>
            <p className="text-xs text-secondary mt-1 leading-relaxed">فريق الدعم متاح لمساعدتك في صياغة إعلانك الوظيفي باحترافية.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
