import { useState } from "react";
import { useNavigate } from "react-router-dom";
import JobPageHeader from "../components/jobs/JobPageHeader";
import JobCard from "../components/jobs/JobCard";
import ConfirmModal from "../components/ui/ConfirmModal";
import useJobs from "../hooks/useJobs";

export default function JobsPage() {
  const { jobs, isLoading, error, activeCount, pendingCount, closedCount, toggleStatus, deleteJob, republishJob, refresh } = useJobs();
  const navigate = useNavigate();
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddJob = () => navigate("/dashboard/jobs/new");
  const handleEditJob = (job) => navigate("/dashboard/jobs/new", { state: { jobToEdit: job } });
  const handleDeleteRequest = (job) => setJobToDelete(job);
  const handleCloseDeleteConfirm = () => setJobToDelete(null);
  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    try {
      await deleteJob(jobToDelete.id);
    } finally {
      setIsDeleting(false);
      setJobToDelete(null);
    }
  };

  return (
    <div className="p-6 min-w-0 max-w-full overflow-visible">
      <div className="max-w-7xl mx-auto">
        <JobPageHeader onAddJob={handleAddJob} />
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <div className="px-3 py-2 bg-white rounded-xl border border-border-subtle text-sm">الوظائف النشطة: <strong>{activeCount}</strong></div>
          <div className="px-3 py-2 bg-white rounded-xl border border-border-subtle text-sm">قيد المراجعة: <strong>{pendingCount}</strong></div>
          <div className="px-3 py-2 bg-white rounded-xl border border-border-subtle text-sm">الوظائف المغلقة: <strong>{closedCount}</strong></div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">جارٍ تحميل الوظائف...</div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-error-red mb-4">حدث خطأ أثناء تحميل الوظائف: {String(error.message || error)}</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={refresh} className="px-6 py-2 rounded-xl bg-primary text-white">إعادة المحاولة</button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onToggleStatus={() => toggleStatus(job.id)}
                    onEdit={handleEditJob}
                    onDelete={handleDeleteRequest}
                    onRepublish={() => republishJob(job.id)}
                  />
                ))
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center" id="empty-state">
                  <div className="w-48 h-48 mb-8">
                    <img
                      className="w-full h-full object-contain"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXsD_ae4f5xCmFJPWHgYQxqbllikp8MF0UEhh9U7xt53h3bDKAZbd0MH3nunvRntvi0c3S8KCUX6ivlkdMVTXZ_oMEAnfOiaeEtvgjARyeuur0Cnx4dlJAcJT-dFVwTaf6701r3FNdymztrO3VxCjPJg06CG7uRNudnBkFjOf7iyVFplVcQa3WtKHMegiyWFkzcShFjaIvS0yelnj_HcjIRXGHWGogeILAwHwhdhb37GUgcItpoE"
                      alt="Empty state illustration"
                    />
                  </div>
                  <h3 className="text-display-lg font-display-lg text-on-surface mb-2">لا توجد وظائف منشورة حالياً</h3>
                  <p className="text-body-lg text-secondary max-w-sm mb-8">ابدأ بنشر أول وظيفة لك اليوم لجذب أفضل المواهب لمطعمك</p>
                  <button type="button" onClick={handleAddJob} className="bg-primary-container text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-primary-container/20">
                    نشر أول وظيفة
                  </button>
                </div>
              )}
            </div>
            <ConfirmModal
              isOpen={Boolean(jobToDelete)}
              title="تأكيد حذف الوظيفة"
              description="هل أنت متأكد أنك تريد حذف هذه الوظيفة؟ لا يمكن التراجع عن هذا الإجراء."
              confirmLabel={isDeleting ? "جاري الحذف..." : "حذف الوظيفة"}
              cancelLabel="إلغاء"
              onClose={handleCloseDeleteConfirm}
              onConfirm={handleConfirmDelete}
              confirmClassName="rounded-2xl bg-error-red px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              icon="close"
            />
          </>
        )}

        {/* Tips moved to AddJobPage */}
      </div>
    </div>
  );
}
