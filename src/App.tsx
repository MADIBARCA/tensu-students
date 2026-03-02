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
import AttendancePage from "./pages/student-pages/attendance/AttendancePage";

import PrivacyPolicy from "./pages/PrivacyPolicy";

/**
 * Map of short page names to full paths.
 * Used for Telegram startapp deep linking.
 */
const PAGE_ROUTES: Record<string, string> = {
  'profile': '/student/profile',
  'main': '/student/main',
  'clubs': '/student/clubs',
  'schedule': '/student/schedule',
  'groups': '/student/groups',
  'attendance': '/student/attendance',
  'onboarding': '/onboarding',
  'privacy': '/privacy',
};

/**
 * Check Telegram startapp parameter synchronously to determine initial route.
 * This runs before React renders to ensure we navigate to the correct page.
 * 
 * Supported formats:
 * - profile → /student/profile
 * - clubs → /student/clubs
 * - etc.
 */
function getTelegramStartParam(): 
  | { type: 'page'; path: string }
  | null 
{
  const tg = window.Telegram?.WebApp;
  const startParam = tg?.startParam;

  if (startParam) {
    console.log('Telegram startapp param:', startParam);
    
    // Handle page navigation: check if startParam matches a known page
    const path = PAGE_ROUTES[startParam];
    if (path) {
      return { type: 'page', path };
    }
  }
  
  return null;
}

// Component to handle Telegram startapp parameter (deep links)
function TelegramStartAppHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled) return;

    const tg = window.Telegram?.WebApp;
    const startParam = tg?.startParam;

    if (startParam) {
      console.log('TelegramStartAppHandler: startapp param:', startParam);
      
      // Handle page navigation
      const path = PAGE_ROUTES[startParam];
      if (path && location.pathname !== path) {
        console.log('Navigating to page:', path);
        navigate(path, { replace: true });
        setHandled(true);
      }
    }
  }, [navigate, handled, location.pathname]);

  return null;
}

// Component to handle default route with Telegram deep link support
function DefaultRoute() {
  // Check if we have a Telegram startapp parameter that should override the default route
  const startParam = getTelegramStartParam();
  
  if (startParam?.type === 'page') {
    // Redirect to the specified page
    return <Navigate to={startParam.path} replace />;
  }
  
  // Default behavior - go to onboarding
  return <Navigate to="/onboarding" replace />;
}

function AppRoutes() {
  const location = useLocation();
  const isOnboarding = location.pathname === "/onboarding";
  const isPrivacy = location.pathname === "/privacy";

  return (
    <div className={isOnboarding || isPrivacy ? "" : "pt-20"}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/student/main" element={<StudentMainPage />} />
        <Route path="/student/schedule" element={<SchedulePage />} />
        <Route path="/student/groups" element={<ClubsPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/attendance" element={<AttendancePage />} />
        <Route path="/student/clubs" element={<ClubsPage />} />

        <Route path="/privacy" element={<PrivacyPolicy />} />
        {/* Default route - checks for Telegram startapp before going to onboarding */}
        <Route path="*" element={<DefaultRoute />} />
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        style={{ marginTop: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}
      />
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
