export default function MaterialIcon({ name, className = "", filled = false }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${filled ? "material-filled" : ""} ${className}`}
    >
      {name}
    </span>
  );
}
