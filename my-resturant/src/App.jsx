import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RestaurantLayout from "./layouts/RestaurantLayout";
import OverviewPage from "./pages/OverviewPage";
import OrdersPage from "./pages/OrdersPage";
import MenuPage from "./pages/MenuPage";
import SettingsPage from "./pages/SettingsPage";
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
    <div className="flex min-h-screen items-center justify-center bg-surface-bg px-4 text-center">
      <div className="space-y-2">
        <p className="font-headline-md text-headline-md text-on-surface">جاري تحميل الجلسة...</p>
        <p className="font-body-md text-body-md text-secondary">يتم التحقق من حالة تسجيل الدخول الحالية.</p>
      </div>
    </div>
  );
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
                <RestaurantLayout onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="orders" element={<OrdersPage />} />
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
