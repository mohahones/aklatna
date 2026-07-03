import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AccountPage from "./pages/AccountPage";
import CashPaymentPage from "./pages/CashPaymentPage";
import WaitingPage from "./pages/WaitingPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userIsActive, setUserIsActive] = useState(null); // ✅ حالة is_active

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      if (!isSupabaseConfigured || !supabase) {
        setIsAuthReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (isMounted) {
        const user = data.session?.user ?? null;
        setCurrentUser(user);
        
        // ✅ إذا كان هناك مستخدم، اقرأ is_active
        if (user) {
          if (user.user_metadata?.role === "admin") {
            setUserIsActive(true); // Admin users are always active
          } else {
            const { data: businessData } = await supabase
              .from("businesses")
              .select("is_active")
              .eq("id", user.id)
              .single();
            setUserIsActive(businessData?.is_active ?? false);
          }
        }
        
        setIsAuthReady(true);
      }
    }

    bootstrapSession();

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        isMounted = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      
      // ✅ إذا كان هناك مستخدم، اقرأ is_active
      if (user) {
        if (user.user_metadata?.role === "admin") {
          setUserIsActive(true); // Admin users are always active
        } else {
          supabase
            .from("businesses")
            .select("is_active")
            .eq("id", user.id)
            .single()
            .then(({ data: businessData }) => {
              setUserIsActive(businessData?.is_active ?? false);
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
            isAdminUser(currentUser) ? 
              <Navigate to="/cash-payment" replace /> : 
              userIsActive === false ? <Navigate to="/waiting" replace /> : <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onSuccess={handleLoginSuccess} />
          )}
        />
        <Route
          path="/signup"
          element={currentUser ? <Navigate to="/account" replace /> : <SignupPage onSignupSuccess={handleSignupSuccess} />}
        />
        <Route
          path="/forgot-password"
          element={currentUser ? (isAdminUser(currentUser) ? <Navigate to="/cash-payment" replace /> : userIsActive === false ? <Navigate to="/waiting" replace /> : <Navigate to="/dashboard" replace />) : <ForgotPasswordPage />}
        />
        <Route
          path="/dashboard"
          element={currentUser ? (
            isAdminUser(currentUser) ? 
              <Navigate to="/cash-payment" replace /> : 
              userIsActive === false ? <Navigate to="/waiting" replace /> : <DashboardPage currentUser={currentUser} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route
          path="/account"
          element={<AccountPage currentUser={currentUser} />}
        />
        <Route
          path="/waiting"
          element={currentUser ? <WaitingPage onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/cash-payment"
          element={currentUser ? <CashPaymentPage onLogout={handleLogout} /> : <Navigate to="/login" replace />}
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
