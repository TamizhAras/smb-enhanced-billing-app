import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import EnhancedBillingPage from './pages/EnhancedBillingPage';
import { CustomersPage } from './pages/CustomersPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TasksPage } from './pages/TasksPage';
import { InventoryPage } from './pages/InventoryPage';
import StaffPage from './pages/StaffPage';
import AIInsightsPage from './pages/AIInsightsPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuthStore } from './store/useAuthStore';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { loadFromStorage, isAuthenticated } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Load auth state from localStorage on app startup
  useEffect(() => {
    loadFromStorage();
    setIsInitialized(true);
  }, [loadFromStorage]);

  // Show nothing while checking auth state
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="*"
          element={
            <RequireAuth>
              <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<OwnerDashboardPage />} />
                      <Route path="/enhanced-billing" element={<EnhancedBillingPage />} />
                      <Route path="/billing" element={<Navigate to="/enhanced-billing" replace />} />
                      <Route path="/customers" element={<CustomersPage />} />
                      <Route path="/tasks" element={<TasksPage />} />
                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/staff" element={<StaffPage />} />
                      <Route path="/feedback" element={<FeedbackPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/ai-insights" element={<AIInsightsPage />} />
                    </Routes>
                  </div>
                </main>
              </div>
              {/* PWA Components */}
              <OfflineIndicator />
              <PWAInstallPrompt />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
