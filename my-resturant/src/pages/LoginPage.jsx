import AuthToast from "../components/auth/AuthToast";
import BrandIdentity from "../components/auth/BrandIdentity";
import LoginCard from "../components/auth/LoginCard";
import SecondaryLinks from "../components/auth/SecondaryLinks";
import { useLoginForm } from "../hooks/useLoginForm";

export default function LoginPage({ onSuccess }) {
  const login = useLoginForm({ onSuccess });

  return (
    <div className="login-shell min-h-screen overflow-hidden bg-surface-bg px-4 py-6 sm:px-6">
      <main className="login-main mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[440px] flex-col justify-center">
        <BrandIdentity />
        <LoginCard
          formData={login.formData}
          showPassword={login.showPassword}
          isSubmitting={login.isSubmitting}
          onSubmit={login.handleSubmit}
          onFieldChange={login.handleFieldChange}
          onTogglePassword={login.togglePassword}
          onSoftAction={login.handleSoftAction}
          errors={login.fieldErrors}
        />
        <SecondaryLinks onSoftAction={login.handleSoftAction} />
      </main>

      <AuthToast status={login.status} message={login.message} />
    </div>
  );
}
