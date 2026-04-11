import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import About from './pages/About';
import Causes from './pages/Causes';
import Impact from './pages/Impact';
import Predict from './pages/Predict';
import Donate from './pages/Donate';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminCauses from './pages/admin/AdminCauses';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDonations from './pages/admin/AdminDonations';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDonationSummary from './pages/admin/AdminDonationSummary';
import AdminUserSummary from './pages/admin/AdminUserSummary';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminPrizePayout from './pages/admin/AdminPrizePayout';
import AdminCauseImpact from './pages/admin/AdminCauseImpact';
import AdminBeneficiaryPayout from './pages/admin/AdminBeneficiaryPayout';
import CausePage from './pages/CausePage';
import StartCause from './pages/StartCause';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import BeneficiaryDashboard from './pages/BeneficiaryDashboard';

import AdminGuard from './components/admin/AdminGuard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/causes" element={<Causes />} />
        <Route path="/causes/:id" element={<CausePage />} />
        <Route path="/start-cause" element={<StartCause />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/beneficiary" element={<BeneficiaryDashboard />} />
        {/* Auth-gated routes */}
        <Route path="/predict" element={<Predict />} />
        <Route path="/history" element={<History />} />
        <Route path="/predictions" element={<History />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminGuard />}>
        <Route index element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="causes" element={<AdminCauses />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="donations" element={<AdminDonations />} />
        <Route path="donation-summary" element={<AdminDonationSummary />} />
        <Route path="user-summary" element={<AdminUserSummary />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="prize-payouts" element={<AdminPrizePayout />} />
        <Route path="beneficiary-payouts" element={<AdminBeneficiaryPayout />} />
        <Route path="cause-impact" element={<AdminCauseImpact />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App