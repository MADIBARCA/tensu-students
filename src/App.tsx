import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
import { useI18n } from "@/i18n/i18n";
import OnboardingPage from "./pages/onboarding/Onboarding";
import StudentMainPage from "./pages/student-pages/main/StudentMainPage";
import SchedulePage from "./pages/student-pages/schedule/SchedulePage";
import ProfilePage from "./pages/student-pages/profile/ProfilePage";
import ClubsPage from "./pages/student-pages/clubs/ClubsPage";
import PaymentCallback from "./pages/student-pages/payment/PaymentCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Component to handle Telegram startapp parameter (deep links)
function TelegramStartAppHandler() {
  const navigate = useNavigate();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled) return;

    const tg = window.Telegram?.WebApp;
    // startParam is a direct property of WebApp, not in initDataUnsafe
    const startParam = tg?.startParam;

    // Debug logging - remove after testing
    console.log('=== TelegramStartAppHandler Debug ===');
    console.log('tg object exists:', !!tg);
    console.log('startParam:', startParam);
    console.log('initData:', tg?.initData);
    console.log('initDataUnsafe:', JSON.stringify(tg?.initDataUnsafe));
    console.log('window.location.href:', window.location.href);
    console.log('window.location.hash:', window.location.hash);
    console.log('=====================================');

    if (startParam) {
      console.log('Telegram startapp param:', startParam);
      
      // Handle payment callback: payment_ID or payment_ID_userId_cardId
      if (startParam.startsWith('payment_')) {
        const paymentId = startParam.replace('payment_', '').split('_')[0];
        console.log('Parsed paymentId:', paymentId);
        // Store payment ID and redirect to callback page
        sessionStorage.setItem('pending_payment_id', paymentId);
        navigate(`/payment/callback?payment_id=${paymentId}`, { replace: true });
        setHandled(true);
      }
    }
  }, [navigate, handled]);

  return null;
}

function AppRoutes() {
  const location = useLocation();
  const isOnboarding = location.pathname === "/onboarding";
  const isPrivacy = location.pathname === "/privacy";
  const isPaymentCallback = location.pathname === "/payment/callback";

  return (
    <div className={isOnboarding || isPrivacy || isPaymentCallback ? "" : "pt-20"}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/student/main" element={<StudentMainPage />} />
        <Route path="/student/schedule" element={<SchedulePage />} />
        <Route path="/student/groups" element={<ClubsPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/clubs" element={<ClubsPage />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        {/* Default route - go to onboarding first */}
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default function App() {
  const { lang } = useI18n();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
  
    tg.ready();
  
    setTimeout(() => {
      tg.requestFullscreen?.();
      tg.expand?.();
  
      if (tg.isVersionAtLeast?.("7.7")) {
        tg.disableVerticalSwipes?.();
      }
    }, 200);
  }, []);

  return (
    <Router>
      <TelegramStartAppHandler />
      <AppRoutes key={lang} />
    </Router>
  );
}
