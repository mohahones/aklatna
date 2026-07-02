import MaterialIcon from "../ui/MaterialIcon";

export function ToastNotification({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-8 left-8 z-[100] flex items-center gap-4 rounded-xl border border-white/10 px-6 py-4 shadow-2xl transition ${
        toast.type === "success"
          ? "bg-inverse-surface text-inverse-on-surface"
          : "bg-error-red text-white"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          toast.type === "success" ? "bg-success-green/20" : "bg-white/20"
        }`}
      >
        <MaterialIcon
          name={toast.type === "success" ? "check_circle" : "cancel"}
          className={toast.type === "success" ? "text-success-green" : "text-white"}
          filled
        />
      </div>
      <div>
        <p className="text-sm font-bold">{toast.title}</p>
        <p className="text-xs opacity-80">{toast.message}</p>
      </div>
    </div>
  );
}
