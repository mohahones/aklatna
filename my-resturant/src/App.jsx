import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RestaurantLayout from "./layouts/RestaurantLayout";
import OverviewPage from "./pages/OverviewPage";
import OffersPage from "./pages/OffersPage";
import OrdersPage from "./pages/OrdersPage";
import MenuPage from "./pages/MenuPage";
import SettingsPage from "./pages/SettingsPage";
import JobsPage from "./pages/JobsPage";
import AddJobPage from "./pages/AddJobPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AccountPage from "./pages/AccountPage";
import CashPaymentPage from "./pages/CashPaymentPage";
import WaitingPage from "./pages/WaitingPage";
import RenewSubscriptionPage from "./pages/RenewSubscriptionPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import useAuth from "./hooks/auth/useAuth";

function AccountRouteWrapper({ currentUser }) {
  const location = useLocation();
  const signupData = location.state?.signupData;

  if (currentUser) return <AccountPage currentUser={currentUser} />;
  if (signupData) return <AccountPage />;
  return <Navigate to="/login" replace />;
}

function AuthLoadingScreen() {
  return (
    <div className="auth-loading-screen flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="space-y-5">
        <img
          src={`${import.meta.env.BASE_URL}icons/my-logo-cleaned.png`}
          alt="aklatna"
          className="mx-auto h-44 w-44 object-contain"
        />
        <p className="font-headline-md text-headline-md text-on-surface">جاري تحميل الجلسة...</p>
      </div>
    </div>
  );
}

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Dashboard render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-bg px-6 text-center">
          <div className="max-w-md rounded-2xl border border-border-subtle bg-white p-6 shadow-sm">
            <p className="text-xl font-bold text-on-surface">حدث خطأ في صفحة العروض</p>
            <p className="mt-2 text-sm text-on-surface-variant">تم إيقاف انهيار الصفحة، ويمكنك إعادة المحاولة.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              إعادة التحميل
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const {
    currentUser,
    isAuthReady,
    userIsActive,
    subscriptionExpired,
    isAdminUser,
    handleLoginSuccess,
    handleSignupSuccess,
    handleLogout,
    getUserLandingPath,
  } = useAuth();

  if (!isAuthReady) {
    return <AuthLoadingScreen />;
  }

  return (
    <BrowserRouter basename="/aklatna">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to={getUserLandingPath()} replace />
            ) : (
              <LoginPage onSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            currentUser ? (
              <Navigate to={getUserLandingPath()} replace />
            ) : (
              <SignupPage onSignupSuccess={handleSignupSuccess} />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            currentUser ? <Navigate to={getUserLandingPath()} replace /> : <ForgotPasswordPage />
          }
        />
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              isAdminUser(currentUser) ? (
                <Navigate to="/cash-payment" replace />
              ) : subscriptionExpired ? (
                <Navigate to="/renew-subscription" replace />
              ) : userIsActive === false ? (
                <Navigate to="/waiting" replace />
              ) : (
                <DashboardErrorBoundary>
                  <RestaurantLayout onLogout={handleLogout} />
                </DashboardErrorBoundary>
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="offers" element={<DashboardErrorBoundary><OffersPage /></DashboardErrorBoundary>} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/new" element={<AddJobPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/account" element={<AccountRouteWrapper currentUser={currentUser} />} />
        <Route
          path="/waiting"
          element={
            currentUser ? (
              isAdminUser(currentUser) ? (
                <Navigate to="/cash-payment" replace />
              ) : subscriptionExpired ? (
                <Navigate to="/renew-subscription" replace />
              ) : userIsActive === false ? (
                <WaitingPage onLogout={handleLogout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/renew-subscription"
          element={
            currentUser ? (
              isAdminUser(currentUser) ? (
                <Navigate to="/cash-payment" replace />
              ) : subscriptionExpired ? (
                <RenewSubscriptionPage onLogout={handleLogout} />
              ) : userIsActive === false ? (
                <Navigate to="/waiting" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/cash-payment"
          element={
            currentUser ? (
              isAdminUser(currentUser) ? (
                <CashPaymentPage onLogout={handleLogout} />
              ) : subscriptionExpired ? (
                <Navigate to="/renew-subscription" replace />
              ) : userIsActive === false ? (
                <Navigate to="/waiting" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/subscriptions"
          element={
            currentUser && isAdminUser(currentUser) ? (
              <SubscriptionsPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
