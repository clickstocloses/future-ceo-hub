import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from '@/stores/userStore';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import CoursesPage from "./pages/CoursesPage";
import ModulePage from "./pages/ModulePage";
import LessonPage from "./pages/LessonPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import CommunityPage from "./pages/CommunityPage";
import SchedulePage from "./pages/SchedulePage";
import BadgesPage from "./pages/BadgesPage";
import ProfilePage from "./pages/ProfilePage";
import SourcesPage from "./pages/SourcesPage";
import RanksPage from "./pages/RanksPage";
import SettingsPage from "./pages/SettingsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AppLayout from "./components/AppLayout";
import CEOHelperChat from "./components/CEOHelperChat";
import { AccessibilityPreferencesModal } from "./components/AccessibilityPreferencesModal";
import ScreenReaderIndicator from "./components/ScreenReaderIndicator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppInit({ children }: { children: React.ReactNode }) {
  const initialize = useUserStore((s) => s.initialize);
  useEffect(() => {
    const unsub = initialize();
    return () => { unsub.then(fn => fn()); };
  }, [initialize]);
  return <>{children}</>;
}

function ScreenReaderIndicatorWrapper() {
  const { preferences } = useAccessibility();
  return <ScreenReaderIndicator visible={preferences.visuallyImpaired} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInit>
          <SettingsProvider>
            <AccessibilityProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected routes with sidebar layout */}
                <Route element={<AppLayout />}>
                  <Route path="/sources" element={<SourcesPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/courses/:moduleId" element={<ModulePage />} />
                  <Route path="/courses/:moduleId/lessons/:lessonId" element={<LessonPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/badges" element={<BadgesPage />} />
                  <Route path="/ranks" element={<RanksPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              <CEOHelperChat />
              <AccessibilityPreferencesModal />
              <ScreenReaderIndicatorWrapper />
            </AccessibilityProvider>
          </SettingsProvider>
        </AppInit>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
