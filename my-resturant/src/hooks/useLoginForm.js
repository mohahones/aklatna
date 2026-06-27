import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { messages } from "../data/loginContent";
import { isSupabaseConfigured, supabase } from "../supabaseClient";
import { useSessionStorageState } from "./useSessionStorageState";

export function useLoginForm({ onSuccess } = {}) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData, clearFormData] = useSessionStorageState("auth-login-form", {
    email: "",
    password: "",
  });

  function notify(nextMessage, nextStatus = "info") {
    setMessage(nextMessage);
    setStatus(nextStatus);
    window.clearTimeout(notify.timeoutId);
    notify.timeoutId = window.setTimeout(() => {
      setMessage("");
      setStatus("idle");
    }, 2600);
  }

  function togglePassword() {
    setShowPassword((current) => !current);
  }

  function handleSoftAction(messageText) {
    notify(messageText);
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const email = String(formData.email ?? "").trim();
    const password = String(formData.password ?? "").trim();

    const nextFieldErrors = {};

    if (!email) {
      nextFieldErrors.email = messages.missingEmail;
    }

    if (!password) {
      nextFieldErrors.password = messages.missingPassword;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setStatus("error");
      setMessage(messages.fixMissingFields);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setStatus("error");
      setMessage(messages.authUnavailable);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setStatus("loading");
    setMessage(messages.checking);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus("error");
        setMessage(messages.invalidCredentials);
        return;
      }

      setStatus("success");
      setMessage(messages.success);
      clearFormData();

      if (typeof onSuccess === "function") {
        onSuccess(data.session ?? null);
      }

      if (data.user?.user_metadata?.role === "admin") {
        navigate("/cash-payment", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
      return;
    } catch {
      setStatus("error");
      setMessage("حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    showPassword,
    isSubmitting,
    status,
    message,
    fieldErrors,
    formData,
    handleFieldChange,
    togglePassword,
    handleSubmit,
    handleSoftAction,
  };
}
