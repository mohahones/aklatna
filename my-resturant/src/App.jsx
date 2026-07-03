import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AccountPage from "./pages/AccountPage";
import CashPaymentPage from "./pages/CashPaymentPage";
import WaitingPage from "./pages/WaitingPage";
import RenewSubscriptionPage from "./pages/RenewSubscriptionPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

// Route helper component: allow access to AccountPage when signupData passed in location.state even if not authenticated yet
function AccountRouteWrapper({ currentUser }) {
  const location = useLocation();
  const signupData = location.state?.signupData;

  if (currentUser) return <AccountPage currentUser={currentUser} />;
  if (signupData) return <AccountPage />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userIsActive, setUserIsActive] = useState(null); // ✅ حالة is_active
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [isBusinessActive, setIsBusinessActive] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      if (!isSupabaseConfigured || !supabase) {
        setIsAuthReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      const user = data.session?.user ?? null;
      setCurrentUser(user);

      if (user) {
        if (user.user_metadata?.role === "admin") {
          setUserIsActive(true);
          setSubscriptionExpired(false);
        } else {
          const { data: businessData } = await supabase
            .from("businesses")
            .select("is_active, expires_at")
            .eq("id", user.id)
            .single();

          const isActive = businessData?.is_active ?? false;
          const expiresAt = businessData?.expires_at;
          const hasExpired = Boolean(expiresAt) && new Date(expiresAt).getTime() < Date.now();

          setUserIsActive(isActive);
          setSubscriptionExpired(hasExpired);
          setIsBusinessActive(isActive && !hasExpired);
        }
      }

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

      if (user) {
        if (user.user_metadata?.role === "admin") {
          setUserIsActive(true);
          setSubscriptionExpired(false);
        } else {
          supabase
            .from("businesses")
            .select("is_active, expires_at")
            .eq("id", user.id)
            .single()
            .then(({ data: businessData }) => {
              const isActive = businessData?.is_active ?? false;
              const expiresAt = businessData?.expires_at;
              const hasExpired = Boolean(expiresAt) && new Date(expiresAt).getTime() < Date.now();

              setUserIsActive(isActive);
              setSubscriptionExpired(hasExpired);
              setIsBusinessActive(isActive && !hasExpired);
            });
        }
      }

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

  function isAdminUser(user) {
    return user?.user_metadata?.role === "admin";
  }

  function handleSignupSuccess(user) {
    setCurrentUser(user ?? null);
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

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }

    setCurrentUser(null);
  }

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-bg px-4 text-center">
        <div className="space-y-2">
          <p className="font-headline-md text-headline-md text-on-surface">جاري تحميل الجلسة...</p>
          <p className="font-body-md text-body-md text-secondary">يتم التحقق من حالة تسجيل الدخول الحالية.</p>
        </div>
      </div>
    );
    
  }

  return (
    <BrowserRouter basename="/aklatna">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={currentUser ? (
            <Navigate to={getUserLandingPath()} replace />
          ) : (
            <LoginPage onSuccess={handleLoginSuccess} />
          )}
        />
        <Route
          path="/signup"
          element={currentUser ? <Navigate to={getUserLandingPath()} replace /> : <SignupPage onSignupSuccess={handleSignupSuccess} />}
        />
        <Route
          path="/forgot-password"
          element={currentUser ? <Navigate to={getUserLandingPath()} replace /> : <ForgotPasswordPage />}
        />
        <Route
          path="/dashboard"
          element={currentUser ? (
            isAdminUser(currentUser) ? 
              <Navigate to="/cash-payment" replace /> : 
              subscriptionExpired ? <Navigate to="/renew-subscription" replace /> : 
              userIsActive === false ? <Navigate to="/waiting" replace /> : <DashboardPage currentUser={currentUser} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route path="/account" element={<AccountRouteWrapper currentUser={currentUser} />} />
        <Route
          path="/waiting"
          element={currentUser ? (
            isAdminUser(currentUser) ? <Navigate to="/cash-payment" replace /> : 
            subscriptionExpired ? <Navigate to="/renew-subscription" replace /> : 
            userIsActive === false ? <WaitingPage onLogout={handleLogout} /> : <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route
          path="/renew-subscription"
          element={currentUser ? (
            isAdminUser(currentUser) ? <Navigate to="/cash-payment" replace /> : 
            subscriptionExpired ? <RenewSubscriptionPage onLogout={handleLogout} /> : 
            userIsActive === false ? <Navigate to="/waiting" replace /> : <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route
          path="/cash-payment"
          element={currentUser ? (
            isAdminUser(currentUser) ? <CashPaymentPage onLogout={handleLogout} /> : 
            subscriptionExpired ? <Navigate to="/renew-subscription" replace /> : 
            userIsActive === false ? <Navigate to="/waiting" replace /> : <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route
          path="/subscriptions"
          element={currentUser && isAdminUser(currentUser) ? <SubscriptionsPage onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
