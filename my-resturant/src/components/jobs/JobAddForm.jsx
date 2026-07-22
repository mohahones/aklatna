import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const initialFormState = {
  title: "",
  business_name: "",
  business_id: null,
  location: "",
  contact_phone: "",
  requirements: "",
  description: "",
  is_active: true,
};

export default function JobAddForm({ initialJob = null }) {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isEditMode = Boolean(initialJob?.id);

  const handleChange = (field) => (event) => {
    const value = field === "is_active" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    if (!initialJob) return;

    setForm((cur) => ({
      ...cur,
      title: initialJob.title || initialJob.title || "",
      description: initialJob.description || "",
      requirements: initialJob.requirements || "",
      contact_phone: initialJob.contact_phone || initialJob.phone || "",
      location: initialJob.location || "",
      business_name: initialJob.business_name || initialJob.restaurant || "",
      business_id: initialJob.business_id || null,
      is_active: initialJob.is_active ?? true,
    }));
  }, [initialJob]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title || null,
        description: form.description || null,
        requirements: form.requirements || null,
        contact_phone: form.contact_phone || null,
        location: form.location || null,
        business_name: form.business_name || null,
        business_id: form.business_id || null,
        is_active: form.is_active,
        is_approved: isEditMode ? false : initialJob?.is_approved ?? false,
      };

      if (isEditMode && initialJob?.id) {
        const { error } = await supabase.from("job_listings").update(payload).eq("id", initialJob.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("job_listings").insert([payload]);
        if (error) throw error;
      }

      setSubmitted(true);
      setForm(initialFormState);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error("Failed to save job listing:", err);
      // Optionally show user-facing error handling here
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      if (!supabase) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setForm((cur) => ({
            ...cur,
            business_id: user.id || cur.business_id,
            business_name: cur.business_name || user.user_metadata?.business_name || cur.business_name,
          }));
        }
      } catch (err) {
        console.error("Failed to load supabase user:", err);
      }
    };

    loadUser();
  }, []);

  return (
    <form className="p-8 space-y-8" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-surface" htmlFor="title">
            عنوان الوظيفة <span className="text-error-red">*</span>
          </label>
          <div className="relative group">
            <input
              id="title"
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange("title")}
              placeholder="مثلاً: طباخ رئيسي، مقدم طعام"
              className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-surface" htmlFor="business_name">
            اسم المطعم/المنشأة <span className="text-error-red">*</span>
          </label>
          <input
            id="business_name"
            name="business_name"
            type="text"
            required
            value={form.business_name}
            onChange={handleChange("business_name")}
            placeholder="اسم علامتك التجارية"
            className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-surface" htmlFor="location">
            الموقع/العنوان <span className="text-error-red">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
              pin_drop
            </span>
            <input
              id="location"
              name="location"
              type="text"
              required
              value={form.location}
              onChange={handleChange("location")}
              placeholder="المدينة، الحي"
              className="w-full pr-12 pl-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-surface" htmlFor="contact_phone">
            رقم التواصل <span className="text-error-red">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
              phone
            </span>
            <input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              required
              dir="ltr"
              value={form.contact_phone}
              onChange={handleChange("contact_phone")}
              placeholder="05XXXXXXXX"
              className="w-full pr-12 pl-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-bold text-on-surface" htmlFor="requirements">
            الشروط والمؤهلات
          </label>
          <textarea
            id="requirements"
            name="requirements"
            rows="3"
            value={form.requirements}
            onChange={handleChange("requirements")}
            placeholder="اذكر المهارات المطلوبة أو سنوات الخبرة..."
            className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-bold text-on-surface" htmlFor="description">
            وصف الوظيفة <span className="text-error-red">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            required
            value={form.description}
            onChange={handleChange("description")}
            placeholder="قدم تفاصيل حول المهام اليومية وبيئة العمل..."
            className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
          />
        </div>

        {/* Active status toggle removed per user request */}
      </div>

      <input name="business_id" type="hidden" value={form.business_id || ""} />

      <div className="pt-6 border-t border-border-subtle flex items-center justify-center">
        <button
          type="submit"
          className="w-full max-w-[420px] px-8 py-3.5 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>جاري النشر...</span>
            </>
          ) : submitted ? (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              <span>{isEditMode ? "تم تحديث الوظيفة بنجاح!" : "تم النشر بنجاح!"}</span>
            </>
          ) : (
            <>
              <span>{isEditMode ? "حفظ التعديلات" : "نشر الوظيفة الآن"}</span>
              <span className="material-symbols-outlined text-xl">send</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
