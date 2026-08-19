import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";

function getResetTokensFromUrl() {
  if (typeof window === "undefined") {
    return { accessToken: "", refreshToken: "", type: "" };
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);

  return {
    accessToken: hashParams.get("access_token") || queryParams.get("access_token") || "",
    refreshToken: hashParams.get("refresh_token") || queryParams.get("refresh_token") || "",
    type: hashParams.get("type") || queryParams.get("type") || "",
  };
}

function clearResetTokensFromUrl() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const keys = ["access_token", "refresh_token", "type", "expires_in", "expires_at", "token_type"];

  for (const key of keys) {
    url.searchParams.delete(key);
  }

  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    for (const key of keys) {
      hashParams.delete(key);
    }

    const nextHash = hashParams.toString();
    url.hash = nextHash ? `#${nextHash}` : "";
  }

  window.history.replaceState({}, "", url.toString());
}

export default function PasswordUpdateForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingSession, setIsPreparingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function prepareSessionFromResetLink() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setStatus("error");
          setMessage("خدمة التحقق غير مهيأة حالياً.");
          setIsPreparingSession(false);
        }
        return;
      }

      const { accessToken, refreshToken } = getResetTokensFromUrl();

      if (!accessToken || !refreshToken) {
        if (isMounted) {
          setIsPreparingSession(false);
        }
        return;
      }

      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          if (isMounted) {
            setStatus("error");
            setMessage("رابط إعادة التعيين غير صالح أو منتهي الصلاحية.");
          }
          return;
        }

        clearResetTokensFromUrl();

        if (isMounted) {
          setStatus("success");
          setMessage("تم التحقق من رابط الاستعادة، يمكنك إدخال كلمة المرور الجديدة.");
        }
      } catch {
        if (isMounted) {
          setStatus("error");
          setMessage("تعذر تجهيز الجلسة من الرابط. أعد فتح الرابط مرة أخرى.");
        }
      } finally {
        if (isMounted) {
          setIsPreparingSession(false);
        }
      }
    }

    prepareSessionFromResetLink();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!password.trim() || password.trim().length < 6) {
      setStatus("error");
      setMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setStatus("error");
      setMessage("خدمة التحقق غير مهيأة حالياً.");
      return;
    }

    setIsSubmitting(true);
    setStatus("loading");
    setMessage("جاري تحديث كلمة المرور...");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) {
        setStatus("error");
        setMessage(error.message || "تعذر تحديث كلمة المرور.");
        return;
      }

      setPassword("");
      setStatus("success");
      setMessage("تم تحديث كلمة المرور بنجاح.");
    } catch {
      setStatus("error");
      setMessage("حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2 text-right">
        <label htmlFor="new-password" className="block font-label-sm text-label-sm text-on-surface-variant">
          كلمة المرور الجديدة
        </label>

        <input
          id="new-password"
          name="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          placeholder="••••••••"
          className="block w-full rounded-lg border border-border-subtle bg-surface-container-low py-3 px-4 text-right font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-secondary-fixed-dim focus:border-primary focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isPreparingSession}
        className="btn-primary flex w-full items-center justify-center rounded-lg px-6 py-4 font-headline-md text-headline-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "جاري التحديث..." : "تحديث كلمة المرور"}
      </button>

      {message ? (
        <p
          className={`font-label-sm text-label-sm ${
            status === "error" ? "text-error" : status === "success" ? "text-success-green" : "text-secondary"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
