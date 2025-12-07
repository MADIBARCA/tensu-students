import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
import { useI18n } from "@/i18n/i18n";
import OnboardingPage from "./pages/onboarding/Onboarding";
import StudentMainPage from "./pages/student-pages/main/StudentMainPage";
import SchedulePage from "./pages/student-pages/schedule/SchedulePage";
import GroupsPage from "./pages/student-pages/groups/GroupsPage";
import ProfilePage from "./pages/student-pages/profile/ProfilePage";
import ClubsPage from "./pages/student-pages/clubs/ClubsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";

function AppRoutes() {
  const location = useLocation();
  const isOnboarding = location.pathname === "/onboarding";

  return (
    <div className={isOnboarding ? "" : "pt-20"}>
      <Routes>
        <Route path="/student/main" element={<StudentMainPage />} />
        <Route path="/student/schedule" element={<SchedulePage />} />
        <Route path="/student/groups" element={<ClubsPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/clubs" element={<ClubsPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        {/* <Route path="/onboarding" element={<OnboardingPage />} /> */}
        <Route path="*" element={<Navigate to="/student/main" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default function App() {
  const { lang } = useI18n();
  React.useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      if (tg.isVersionAtLeast('7.7')) {
        tg.disableVerticalSwipes();
      }
    }
  }, []);

  return (
    <Router>
      <AppRoutes key={lang} />
    </Router>
  );
}
