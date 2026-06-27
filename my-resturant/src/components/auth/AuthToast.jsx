import MaterialIcon from "../ui/MaterialIcon";

const statusIcon = {
  idle: "info",
  info: "info",
  loading: "sync",
  success: "check_circle",
};

export default function AuthToast({ status, message }) {
  if (!message) return null;

  return (
    <div className="auth-toast" role="status" aria-live="polite">
      <MaterialIcon
        name={statusIcon[status] ?? "info"}
        className={`text-xl ${status === "loading" ? "animate-spin" : ""}`}
      />
      <span>{message}</span>
    </div>
  );
}
