import MaterialIcon from "../ui/MaterialIcon";
import { useEffect, useRef, useState } from "react";
import { useSessionStorageState } from "../../hooks/useSessionStorageState";

const days = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];

function createDefaultHours() {
  return days.map((day) => ({
    day,
    isOpen: true,
    openTime: "09:00",
    closeTime: "22:00",
  }));
}

export default function SignupFormStep2({ onSubmit, onBack, isLoading = false }) {
  const fileInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState("");
  const [openingHours, setOpeningHours] = useSessionStorageState("auth-signup-step2-hours", createDefaultHours);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  function handleFile(file) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLocalError("يرجى اختيار صورة صالحة");
      return;
    }

    setLocalError("");
    setLogoFile(file);

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoPreview(URL.createObjectURL(file));
  }

  function handleFileChange(event) {
    handleFile(event.target.files?.[0]);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragActive(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function updateDay(index, key, value) {
    setOpeningHours((current) =>
      current.map((entry, currentIndex) => (currentIndex === index ? { ...entry, [key]: value } : entry)),
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!openingHours.some((entry) => entry.isOpen)) {
      setLocalError("حدد ساعات العمل ليوم واحد على الأقل");
      return;
    }

    setLocalError("");

    if (typeof onSubmit === "function") {
      onSubmit({
        logoFile,
        openingHours,
      });
    }
  }

  return (
    <form className="space-y-10" onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <label className="font-headline-md text-headline-md block">
          شعار المطعم <span className="text-secondary font-normal">(اختياري)</span>
        </label>

        <div
          id="drop-zone"
          className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-surface-container-lowest cursor-pointer ${
            isDragActive ? "border-primary bg-primary-fixed" : "border-outline-variant hover:border-primary"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input ref={fileInputRef} accept="image/*" className="hidden" id="logo-upload" type="file" onChange={handleFileChange} />

          <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden ${logoPreview ? "bg-success-green/20" : "bg-primary-fixed text-primary"}`}>
            {logoPreview ? (
              <img alt="شعار المطعم" className="w-full h-full object-cover" src={logoPreview} />
            ) : (
              <MaterialIcon name="upload_file" className="text-[32px]" />
            )}
          </div>

          <div className="text-center">
            <p className="font-body-lg text-body-lg font-semibold">
              {logoFile ? `الملف المختار: ${logoFile.name}` : "انقر للتحميل أو قم بالسحب والإفلات"}
            </p>
            <p className="font-label-sm text-label-sm text-secondary">SVG, PNG, JPG (بحد أقصى 800x400 بكسل)</p>
          </div>
        </div>

        {localError && <p className="font-label-sm text-label-sm text-error">{localError}</p>}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MaterialIcon name="schedule" className="text-primary" />
          <label className="font-headline-md text-headline-md">ساعات العمل الأسبوعية</label>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-border-subtle overflow-hidden">
          <div className="divide-y divide-border-subtle">
            {openingHours.map((dayEntry, index) => (
              <div className="p-4 flex flex-col sm:flex-row-reverse sm:items-center justify-between gap-4" key={dayEntry.day}>
                <div className="flex items-center gap-3 min-w-[120px] justify-start">
                  <input
                    checked={dayEntry.isOpen}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                    type="checkbox"
                    onChange={(event) => updateDay(index, "isOpen", event.target.checked)}
                  />
                  <span className="font-body-lg text-body-lg font-medium">{dayEntry.day}</span>
                </div>

                <div className={`flex flex-row-reverse items-center gap-4 ${dayEntry.isOpen ? "" : "opacity-50"}`}>
                  <div className="flex flex-col text-right">
                    <span className="font-label-sm text-label-sm text-secondary mb-1">يفتح</span>
                    <input
                      className="bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md focus:border-primary text-right disabled:cursor-not-allowed"
                      disabled={!dayEntry.isOpen}
                      type="time"
                      value={dayEntry.openTime}
                      onChange={(event) => updateDay(index, "openTime", event.target.value)}
                    />
                  </div>

                  <div className="text-secondary mt-5">
                    <MaterialIcon name="arrow_forward" className="mirror-rtl text-xl" />
                  </div>

                  <div className="flex flex-col text-right">
                    <span className="font-label-sm text-label-sm text-secondary mb-1">يغلق</span>
                    <input
                      className="bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md focus:border-primary text-right disabled:cursor-not-allowed"
                      disabled={!dayEntry.isOpen}
                      type="time"
                      value={dayEntry.closeTime}
                      onChange={(event) => updateDay(index, "closeTime", event.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <button
          className="btn-accent flex-[2] px-8 py-4 font-bold rounded-xl active:scale-[0.98] transition-all font-body-lg text-body-lg disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "جاري المعالجة..." : "إكمال التسجيل"}
        </button>

        <button
          className="btn-secondary flex-1 px-8 py-4 font-semibold rounded-xl font-body-lg text-body-lg"
          type="button"
          onClick={onBack}
        >
          رجوع
        </button>
      </div>
    </form>
  );
}
