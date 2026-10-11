import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthPage from '@/pages/AuthPage';
import Layout, { type Page } from '@/components/Layout';
import BackgroundScanner from '@/components/BackgroundScanner';
import Dashboard from '@/pages/Dashboard';
import LinkScanner from '@/pages/LinkScanner';
import ReportThreat from '@/pages/ReportThreat';
import ThreatFeed from '@/pages/ThreatFeed';
import BlockedItems from '@/pages/BlockedItems';
import Employees from '@/pages/Employees';
import Transactions from '@/pages/Transactions';
import SmsAlerts from '@/pages/SmsAlerts';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('scanner');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <>
      <Layout currentPage={page} onNavigate={setPage}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'scanner' && <LinkScanner />}
        {page === 'report' && <ReportThreat />}
        {page === 'threats' && <ThreatFeed />}
        {page === 'blocked' && <BlockedItems />}
        {page === 'employees' && <Employees />}
        {page === 'transactions' && <Transactions />}
        {page === 'sms' && <SmsAlerts />}
        {page === 'analytics' && <Analytics />}
        {page === 'settings' && <Settings />}
      </Layout>
      <BackgroundScanner />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
