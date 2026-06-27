import MaterialIcon from "../ui/MaterialIcon";

export default function LoginInput({
  id,
  label,
  icon,
  type = "text",
  placeholder,
  autoComplete,
  trailing,
  error,
  value,
  onChange,
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <label className="block text-right font-label-sm text-label-sm text-on-surface-variant" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <MaterialIcon
            name={icon}
            className="text-xl text-secondary transition-colors group-focus-within:text-primary"
          />
        </div>
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="block w-full rounded-lg border border-border-subtle bg-surface-container-low py-3 pl-12 pr-10 text-right font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-secondary-fixed-dim focus:border-primary focus:ring-2 focus:ring-primary"
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-error`} className="font-label-sm text-label-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
