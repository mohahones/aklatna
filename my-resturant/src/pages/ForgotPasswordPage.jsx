import { Link } from "react-router-dom";
import BrandIdentity from "../components/auth/BrandIdentity";
import LoginInput from "../components/auth/LoginInput";
import { useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

async function checkIfEmailExistsInSupabase(email) {
  if (!supabase || typeof supabase.auth?.admin?.getUserByEmail !== "function") {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.admin.getUserByEmail(email);
    if (error) {
      return false;
    }

    return Boolean(data?.user);
  } catch {
    return null;
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const normalizedEmail = String(email || "").trim();

    if (!normalizedEmail) {
      setStatus("error");
      setMessage("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setStatus("error");
      setMessage("خدمة استعادة كلمة المرور غير مهيأة حالياً.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("loading");
      setMessage("جاري التحقق من الحساب...");

      const existsResult = await checkIfEmailExistsInSupabase(normalizedEmail);

      if (existsResult === false) {
        setStatus("error");
        setMessage("البريد الإلكتروني خاطئ.");
        return;
      }

      setMessage("جاري إرسال رابط الاستعادة...");

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: "https://amer-kriany.github.io/aklatna_confirm/reset-password.html",
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      setMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
    } catch (error) {
      const errorText = String(error?.message || "").toLowerCase();
      const isUserNotFound = /user not found|invalid login credentials|email not found|not found/i.test(errorText);

      setStatus("error");
      setMessage(isUserNotFound ? "البريد الإلكتروني خاطئ." : error?.message || "حدث خطأ أثناء إرسال رابط الاستعادة.");
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={isSubmitting}
              className="btn-primary flex w-full items-center justify-center rounded-lg px-6 py-4 font-headline-md text-headline-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
            </button>
          </form>

          {message ? (
            <p
              className={`mt-6 font-label-sm text-label-sm ${
                status === "error" ? "text-error" : status === "success" ? "text-success-green" : "text-secondary"
              }`}
            >
              {message}
            </p>
          ) : null}

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