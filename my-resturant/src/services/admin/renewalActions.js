import { isSupabaseConfigured, supabase } from "../../supabaseClient";

const SUBSCRIPTION_EXTENSION_DAYS = 30;

function computeNewExpiresAt(currentExpiresAt) {
  const now = new Date();

  if (!currentExpiresAt) {
    const next = new Date(now);
    next.setDate(next.getDate() + SUBSCRIPTION_EXTENSION_DAYS);
    return next;
  }

  const currentExpires = new Date(currentExpiresAt);
  const base = currentExpires.getTime() > now.getTime() ? currentExpires : now;
  const next = new Date(base);
  next.setDate(next.getDate() + SUBSCRIPTION_EXTENSION_DAYS);
  return next;
}

export async function approveRenewalRequest(requestId, businessId, currentExpiresAt = null) {
  if (!isSupabaseConfigured || !supabase || !requestId || !businessId) {
    return new Error("Missing request or business id");
  }

  try {
    let expiresAt = currentExpiresAt;

    if (!expiresAt) {
      const { data: business, error: bizErr } = await supabase
        .from("businesses")
        .select("expires_at")
        .eq("id", businessId)
        .single();

      if (bizErr) {
        console.error("Error fetching business expiry:", bizErr);
        return bizErr;
      }

      expiresAt = business?.expires_at || null;
    }

    const newExpiresAt = computeNewExpiresAt(expiresAt);

    const { error: updateErr } = await supabase
      .from("businesses")
      .update({ is_active: true, expires_at: newExpiresAt.toISOString() })
      .eq("id", businessId);

    if (updateErr) {
      console.error("Error updating business expiry:", updateErr);
      return updateErr;
    }

    const { error: reqErr } = await supabase
      .from("subscription_requests")
      .update({ status: "approved" })
      .eq("id", requestId);

    if (reqErr) {
      console.error("Error approving renewal request:", reqErr);
      return reqErr;
    }

    return null;
  } catch (err) {
    console.error("Exception approving renewal:", err);
    return err;
  }
}

export async function rejectRenewalRequest(requestId) {
  if (!isSupabaseConfigured || !supabase || !requestId) {
    return new Error("Missing request id");
  }

  try {
    const { error } = await supabase
      .from("subscription_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    if (error) {
      console.error("Error rejecting renewal request:", error);
      return error;
    }

    return null;
  } catch (err) {
    console.error("Exception rejecting renewal:", err);
    return err;
  }
}

export async function deleteExpiredSubscriber(businessId) {
  if (!isSupabaseConfigured || !supabase || !businessId) return null;

  try {
    const { error } = await supabase.rpc("admin_reject_and_delete_business", {
      p_business_id: businessId,
    });

    if (error) {
      console.error("Error deleting subscriber:", error);
      return error;
    }

    return null;
  } catch (err) {
    console.error("Exception deleting subscriber:", err);
    return err;
  }
}
