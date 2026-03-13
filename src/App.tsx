import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SystemProvider } from "@/contexts/SystemContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import SystemPage from "./pages/SystemPage";
import FrontPage from "./pages/FrontPage";
import JournalPage from "./pages/JournalPage";
import MessagesPage from "./pages/MessagesPage";
import TasksPage from "./pages/TasksPage";
import CalendarPage from "./pages/CalendarPage";
import SafetyPage from "./pages/SafetyPage";
import GroundingPage from "./pages/GroundingPage";
import SettingsPage from "./pages/SettingsPage";
import InsightsPage from "./pages/InsightsPage";
import TimelinePage from "./pages/TimelinePage";
import QuickActionsPage from "./pages/QuickActionsPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <SystemProvider>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/system" element={<SystemPage />} />
                        <Route path="/front" element={<FrontPage />} />
                        <Route path="/journal" element={<JournalPage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/tasks" element={<TasksPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/safety" element={<SafetyPage />} />
                        <Route path="/grounding" element={<GroundingPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/insights" element={<InsightsPage />} />
                        <Route path="/timeline" element={<TimelinePage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </SystemProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
