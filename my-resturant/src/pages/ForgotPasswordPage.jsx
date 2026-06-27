import { Link } from "react-router-dom";
import BrandIdentity from "../components/auth/BrandIdentity";
import LoginInput from "../components/auth/LoginInput";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("إذا كان البريد موجوداً فسيتم إرسال رابط إعادة التعيين إليه.");
  }

  return (
    <div className="login-shell min-h-screen overflow-hidden bg-surface-bg px-4 py-6 sm:px-6">
      <main className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[440px] flex-col justify-center">
        <BrandIdentity />

        <section className="login-card-shadow rounded-xl border border-border-subtle bg-surface-container-lowest p-8 md:p-10 text-right">
          <div className="space-y-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">استعادة كلمة المرور</h2>
            <p className="font-body-md text-body-md text-secondary">
              أدخل البريد الإلكتروني المرتبط بالحساب وسنرسل لك رابط إعادة التعيين.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <LoginInput
              id="email"
              label="عنوان البريد الإلكتروني"
              icon="mail"
              type="email"
              autoComplete="email"
              placeholder="manager@restaurant.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <button
              type="submit"
              className="btn-primary flex w-full items-center justify-center rounded-lg px-6 py-4 font-headline-md text-headline-md"
            >
              إرسال رابط الاستعادة
            </button>
          </form>

          {message ? <p className="mt-6 font-label-sm text-label-sm text-success-green">{message}</p> : null}

          <div className="mt-8 text-center">
            <Link to="/login" className="font-bold text-primary transition-all hover:underline">
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}