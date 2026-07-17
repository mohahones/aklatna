import { useEffect, useState } from "react";
import ConfirmModal from "../components/ui/ConfirmModal";
import RestaurantInfoSection from "../components/settings/RestaurantInfoSection";
import LogoManagementSection from "../components/settings/LogoManagementSection";
import WorkingHoursSection from "../components/settings/WorkingHoursSection";
import useBusinessBranding from "../hooks/settings/useBusinessBranding";
import useBusinessInfo from "../hooks/settings/useBusinessInfo";
import useBusinessHours from "../hooks/settings/useBusinessHours";

const SAVE_CONFIRM_CONFIG = {
  info: {
    title: "حفظ معلومات المطعم",
    description: "سيتم تحديث اسم المطعم والهاتف والعنوان في قاعدة البيانات. هل تريد المتابعة؟",
    confirmLabel: "نعم، احفظ في قاعدة البيانات",
  },
  hours: {
    title: "تحديث ساعات العمل",
    description: "سيتم حفظ جدول ساعات العمل في قاعدة البيانات. هل تريد المتابعة؟",
    confirmLabel: "نعم، احفظ في قاعدة البيانات",
  },
  branding: {
    title: "حفظ الشعار وصورة الغلاف",
    description: "سيتم رفع الصور وتحديثها في قاعدة البيانات. هل تريد المتابعة؟",
    confirmLabel: "نعم، احفظ في قاعدة البيانات",
  },
};

function revokeBlobUrl(url) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export default function SettingsPage() {
  const {
    logoUrl: savedLogoUrl,
    coverUrl: savedCoverUrl,
    isLoading: isBrandingLoading,
    isSaving: isBrandingSaving,
    error: brandingError,
    saveBranding,
  } = useBusinessBranding();

  const {
    info: restaurantInfo,
    setInfo: setRestaurantInfo,
    isLoading: isInfoLoading,
    isSaving: isInfoSaving,
    error: infoError,
    saveInfo,
  } = useBusinessInfo();

  const {
    hours: workingHours,
    changeDay,
    isLoading: isHoursLoading,
    isSaving: isHoursSaving,
    error: hoursError,
    saveHours,
  } = useBusinessHours();

  const [confirmSave, setConfirmSave] = useState({ open: false, type: null });
  const [saveFeedback, setSaveFeedback] = useState(null);

  const [previewLogoUrl, setPreviewLogoUrl] = useState("");
  const [previewCoverUrl, setPreviewCoverUrl] = useState("");
  const [pendingLogoFile, setPendingLogoFile] = useState(null);
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);

  const activeConfirm = confirmSave.type ? SAVE_CONFIRM_CONFIG[confirmSave.type] : null;

  const hasBrandingChanges =
    Boolean(pendingLogoFile) ||
    Boolean(pendingCoverFile) ||
    removeLogo ||
    removeCover;

  useEffect(() => {
    if (isBrandingLoading) return;
    if (!pendingLogoFile && !removeLogo) {
      setPreviewLogoUrl(savedLogoUrl);
    }
    if (!pendingCoverFile && !removeCover) {
      setPreviewCoverUrl(savedCoverUrl);
    }
  }, [
    isBrandingLoading,
    savedLogoUrl,
    savedCoverUrl,
    pendingLogoFile,
    pendingCoverFile,
    removeLogo,
    removeCover,
  ]);

  function handleChangeDay(index, updated) {
    changeDay(index, updated);
  }

  function openSaveConfirm(type) {
    setConfirmSave({ open: true, type });
  }

  function closeSaveConfirm() {
    setConfirmSave({ open: false, type: null });
  }

  function showSaveFeedback(type, message) {
    setSaveFeedback({ type, message });
    window.clearTimeout(showSaveFeedback.timeoutId);
    showSaveFeedback.timeoutId = window.setTimeout(() => setSaveFeedback(null), 3500);
  }

  function handleSelectLogoFile(file) {
    revokeBlobUrl(previewLogoUrl);
    setPreviewLogoUrl(URL.createObjectURL(file));
    setPendingLogoFile(file);
    setRemoveLogo(false);
  }

  function handleSelectCoverFile(file) {
    revokeBlobUrl(previewCoverUrl);
    setPreviewCoverUrl(URL.createObjectURL(file));
    setPendingCoverFile(file);
    setRemoveCover(false);
  }

  function handleRemoveLogoPreview() {
    revokeBlobUrl(previewLogoUrl);
    setPreviewLogoUrl("");
    setPendingLogoFile(null);
    setRemoveLogo(true);
  }

  function handleRemoveCoverPreview() {
    revokeBlobUrl(previewCoverUrl);
    setPreviewCoverUrl("");
    setPendingCoverFile(null);
    setRemoveCover(true);
  }

  function handleBrandingSaveClick() {
    if (!hasBrandingChanges) {
      showSaveFeedback("error", "لا توجد تغييرات لحفظها.");
      return;
    }
    openSaveConfirm("branding");
  }

  function handleInfoSaveClick() {
    if (!restaurantInfo.nameAr?.trim() || !restaurantInfo.phone?.trim() || !restaurantInfo.address?.trim()) {
      showSaveFeedback("error", "يرجى تعبئة الاسم والهاتف والعنوان قبل الحفظ.");
      return;
    }
    openSaveConfirm("info");
  }

  function handleHoursSaveClick() {
    openSaveConfirm("hours");
  }

  async function handleConfirmSave() {
    const { type } = confirmSave;
    closeSaveConfirm();

    if (type === "info") {
      const { error } = await saveInfo(restaurantInfo);
      if (error) {
        showSaveFeedback("error", error.message || "فشل حفظ معلومات المطعم.");
        return;
      }
      showSaveFeedback("success", "تم حفظ معلومات المطعم في قاعدة البيانات.");
      return;
    }

    if (type === "hours") {
      const { error } = await saveHours(workingHours);
      if (error) {
        showSaveFeedback("error", error.message || "فشل حفظ ساعات العمل.");
        return;
      }
      showSaveFeedback("success", "تم حفظ ساعات العمل في قاعدة البيانات.");
      return;
    }

    if (type === "branding") {
      const { logoUrl, coverUrl, error } = await saveBranding({
        logoFile: pendingLogoFile,
        coverFile: pendingCoverFile,
        removeLogo,
        removeCover,
      });

      if (error) {
        showSaveFeedback("error", error.message || "فشل حفظ الصور في قاعدة البيانات.");
        return;
      }

      revokeBlobUrl(previewLogoUrl);
      revokeBlobUrl(previewCoverUrl);
      setPreviewLogoUrl(logoUrl);
      setPreviewCoverUrl(coverUrl);
      setPendingLogoFile(null);
      setPendingCoverFile(null);
      setRemoveLogo(false);
      setRemoveCover(false);
      showSaveFeedback("success", "تم حفظ الشعار وصورة الغلاف في قاعدة البيانات.");
    }
  }

  return (
    <div className="px-8 pb-12 pt-6 min-w-0 text-right">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h2 className="font-display-lg text-display-lg text-on-surface">الإعدادات والملف الشخصي</h2>
          <p className="font-body-lg text-body-lg text-secondary">
            إدارة هوية مطعمك، ساعات العمل، وتفضيلات البوابة.
          </p>
        </div>

        {saveFeedback ? (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
              saveFeedback.type === "success"
                ? "bg-success-green/10 text-success-green"
                : "bg-error-red/10 text-error-red"
            }`}
          >
            {saveFeedback.message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2 space-y-6">
            <RestaurantInfoSection
              info={restaurantInfo}
              onChange={setRestaurantInfo}
              onSave={handleInfoSaveClick}
              isLoading={isInfoLoading}
              isSaving={isInfoSaving}
              error={infoError}
            />
            <LogoManagementSection
              previewLogoUrl={previewLogoUrl}
              previewCoverUrl={previewCoverUrl}
              isLoading={isBrandingLoading}
              isSaving={isBrandingSaving}
              error={brandingError}
              hasPendingChanges={hasBrandingChanges}
              hasPendingLogoChange={Boolean(pendingLogoFile) || removeLogo}
              hasPendingCoverChange={Boolean(pendingCoverFile) || removeCover}
              onSelectLogoFile={handleSelectLogoFile}
              onSelectCoverFile={handleSelectCoverFile}
              onRemoveLogoPreview={handleRemoveLogoPreview}
              onRemoveCoverPreview={handleRemoveCoverPreview}
              onSave={handleBrandingSaveClick}
            />
          </div>

          <div className="lg:col-span-1">
            <WorkingHoursSection
              hours={workingHours}
              onChangeDay={handleChangeDay}
              onSave={handleHoursSaveClick}
              isLoading={isHoursLoading}
              isSaving={isHoursSaving}
              error={hoursError}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmSave.open}
        title={activeConfirm?.title ?? ""}
        description={activeConfirm?.description ?? ""}
        confirmLabel={activeConfirm?.confirmLabel ?? "تأكيد"}
        onClose={closeSaveConfirm}
        onConfirm={handleConfirmSave}
        confirmClassName="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        iconClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      />
    </div>
  );
}
