import { Link } from "react-router-dom";
import { loginCopy, messages } from "../../data/loginContent";
import MaterialIcon from "../ui/MaterialIcon";
import LoginInput from "./LoginInput";

export default function LoginForm({
  formData,
  onFieldChange,
  showPassword,
  isSubmitting,
  onSubmit,
  onTogglePassword,
  errors = {},
}) {
  const passwordToggleLabel = showPassword ? messages.hidePassword : messages.showPassword;

  return (
    <form className="space-y-6" method="POST" noValidate onSubmit={onSubmit}>
      <LoginInput
        id="email"
        label={loginCopy.emailLabel}
        icon="mail"
        type="email"
        autoComplete="email"
        placeholder={loginCopy.emailPlaceholder}
        error={errors.email}
        value={formData.email}
        onChange={onFieldChange}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">
            {loginCopy.passwordLabel}
          </label>
          <Link
            to="/forgot-password"
            className="font-label-sm text-label-sm text-primary transition-colors hover:text-on-primary-fixed-variant"
          >
            {loginCopy.forgotPassword}
          </Link>
        </div>

        <LoginInput
          id="password"
          label=""
          icon="lock"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder={loginCopy.passwordPlaceholder}
          error={errors.password}
          value={formData.password}
          onChange={onFieldChange}
          trailing={
            <button
              type="button"
              aria-label={passwordToggleLabel}
              title={passwordToggleLabel}
              onClick={onTogglePassword}
              className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary transition-colors hover:text-on-surface"
            >
              <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-xl" />
            </button>
          }
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary group flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 font-headline-md text-headline-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-85"
      >
        {isSubmitting ? (
          <>
            <MaterialIcon name="sync" className="text-xl animate-spin" />
            <span>{loginCopy.loading}</span>
          </>
        ) : (
          <>
            <span>{loginCopy.submit}</span>
            <MaterialIcon name="arrow_back" className="text-xl transition-transform group-hover:-translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
