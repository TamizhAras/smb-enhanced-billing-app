import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { BillingPage } from './pages/BillingPage';
import EnhancedBillingPage from './pages/EnhancedBillingPage';
import { CustomersPage } from './pages/CustomersPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TasksPage } from './pages/TasksPage';
import { InventoryPage } from './pages/InventoryPage';
import StaffPage from './pages/StaffPage';
import AIInsightsPage from './pages/AIInsightsPage';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/enhanced-billing" replace />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/enhanced-billing" element={<EnhancedBillingPage />} />
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
    </Router>
  );
}

export default App;
