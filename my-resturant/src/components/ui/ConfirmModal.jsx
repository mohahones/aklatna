export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "إلغاء",
  onConfirm,
  onClose,
  confirmClassName = "rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90",
  iconClassName = "flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary",
  icon = "plus",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-[26px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_120px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={iconClassName}>
            {icon === "close" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={confirmClassName}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
