import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

const PENDING_MESSAGE = "تم إرسال طلبك إلى الإدارة. سيتم مراجعة الطلب قريباً.";
const ALREADY_PENDING_MESSAGE = "تم إرسال طلب تجديد سابقاً وهو قيد الانتظار.";

/**
 * مصدر الحالة: جدول subscription_requests
 * - business_id  ← session.user.id (نفس id في جدول businesses)
 * - status       ← pending | approved | rejected
 * - request_type ← RENEWAL
 * - id           ← رقم الصف (يُولَّد تلقائياً)
 */
async function getCurrentBusinessId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

async function fetchPendingRenewalRequest(businessId) {
  const { data, error } = await supabase
    .from("subscription_requests")
    .select("id, status, business_id, request_type")
    .eq("business_id", businessId)
    .eq("request_type", "RENEWAL")
    .eq("status", "pending")
    .limit(1);

  return {
    request: data?.[0] ?? null,
    error,
  };
}

function isDuplicateRequestError(error) {
  return error?.code === "23505" || /duplicate/i.test(error?.message || "");
}

export default function useRenewSubscription() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [requestStatus, setRequestStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);

  const applyPendingState = useCallback((request) => {
    const isPending = request?.status === "pending";
    setHasRequested(isPending);
    setMessage(isPending ? PENDING_MESSAGE : "");
    setRequestStatus(request?.status ?? null);
    setRequestId(request?.id ?? null);
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setIsChecking(false);
      return;
    }

    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      applyPendingState(null);
      setIsChecking(false);
      return;
    }

    const { request, error } = await fetchPendingRenewalRequest(businessId);
    if (error) {
      console.error("Error reading renewal status:", error);
      setIsChecking(false);
      return;
    }

    applyPendingState(request);
    setIsChecking(false);
  }, [applyPendingState]);

  useEffect(() => {
    let channel = null;
    let isMounted = true;

    async function init() {
      setIsChecking(true);
      await refreshStatus();

      const businessId = await getCurrentBusinessId();
      if (!isMounted || !businessId || !supabase) return;

      channel = supabase
        .channel(`renewal-status-${businessId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "subscription_requests",
            filter: `business_id=eq.${businessId}`,
          },
          async (payload) => {
            const row = payload.new;
            if (!row || row.request_type !== "RENEWAL") return;
            await refreshStatus();
          }
        )
        .subscribe();
    }

    init();

    return () => {
      isMounted = false;
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshStatus]);

  async function sendRenewRequest() {
    if (!isSupabaseConfigured || !supabase || isSubmitting) return false;

    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      setMessage("يرجى تسجيل الدخول مجدداً قبل إرسال الطلب.");
      return false;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const { request: existingRequest, error: checkError } =
        await fetchPendingRenewalRequest(businessId);

      if (checkError) {
        setMessage("تعذر التحقق من حالة الطلب. حاول مرة أخرى.");
        setIsSubmitting(false);
        return false;
      }

      if (existingRequest) {
        applyPendingState(existingRequest);
        setMessage(ALREADY_PENDING_MESSAGE);
        setIsSubmitting(false);
        return true;
      }

      const { error } = await supabase.from("subscription_requests").insert([
        {
          business_id: businessId,
          request_type: "RENEWAL",
          status: "pending",
        },
      ]);

      if (error) {
        if (isDuplicateRequestError(error)) {
          await refreshStatus();
          setMessage(ALREADY_PENDING_MESSAGE);
          setIsSubmitting(false);
          return true;
        }

        setMessage(error.message || "حدث خطأ أثناء إرسال طلب التجديد. حاول مرة أخرى.");
        console.error(error);
        setIsSubmitting(false);
        return false;
      }

      await refreshStatus();
      setIsSubmitting(false);
      return true;
    } catch (err) {
      console.error("Exception sending renewal request:", err);
      setMessage("حدث خطأ أثناء إرسال طلب التجديد. حاول مرة أخرى.");
      setIsSubmitting(false);
      return false;
    }
  }

  return {
    isSubmitting,
    hasRequested,
    message,
    isChecking,
    requestStatus,
    requestId,
    sendRenewRequest,
    refreshStatus,
  };
}
