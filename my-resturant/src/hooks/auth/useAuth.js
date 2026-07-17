import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";

function isAdminUser(user) {
  return user?.app_metadata?.role === "admin";
}

async function loadBusinessStatus(userId) {
  const { data: businessData } = await supabase
    .from("businesses")
    .select("is_active, expires_at")
    .eq("id", userId)
    .single();

  const isActive = businessData?.is_active ?? false;
  const expiresAt = businessData?.expires_at;
  const hasExpired = Boolean(expiresAt) && new Date(expiresAt).getTime() < Date.now();

  return {
    userIsActive: isActive,
    subscriptionExpired: hasExpired,
    isBusinessActive: isActive && !hasExpired,
  };
}

export default function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userIsActive, setUserIsActive] = useState(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [isBusinessActive, setIsBusinessActive] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function applyUserState(user) {
      if (!user) {
        setUserIsActive(null);
        setSubscriptionExpired(false);
        setIsBusinessActive(null);
        return;
      }

      if (isAdminUser(user)) {
        setUserIsActive(true);
        setSubscriptionExpired(false);
        setIsBusinessActive(true);
        return;
      }

      const status = await loadBusinessStatus(user.id);
      if (!isMounted) return;

      setUserIsActive(status.userIsActive);
      setSubscriptionExpired(status.subscriptionExpired);
      setIsBusinessActive(status.isBusinessActive);
    }

    async function bootstrapSession() {
      if (!isSupabaseConfigured || !supabase) {
        setIsAuthReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      const user = data.session?.user ?? null;
      setCurrentUser(user);
      await applyUserState(user);
      setIsAuthReady(true);
    }

    bootstrapSession();

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        isMounted = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      const user = session?.user ?? null;
      setCurrentUser(user);
      applyUserState(user);
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  function handleLoginSuccess(session) {
    setCurrentUser(session?.user ?? null);
  }

  function handleSignupSuccess(user) {
    setCurrentUser(user ?? null);
  }

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setUserIsActive(null);
    setSubscriptionExpired(false);
    setIsBusinessActive(null);
  }

  function getUserLandingPath() {
    if (!currentUser) return "/login";
    if (isAdminUser(currentUser)) return "/cash-payment";
    if (isBusinessActive === false) {
      if (subscriptionExpired) return "/renew-subscription";
      return "/waiting";
    }
    return "/dashboard";
  }

  return {
    currentUser,
    isAuthReady,
    userIsActive,
    subscriptionExpired,
    isBusinessActive,
    isAdminUser,
    handleLoginSuccess,
    handleSignupSuccess,
    handleLogout,
    getUserLandingPath,
  };
}
