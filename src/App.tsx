import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { OwnerSetupView } from './components/OwnerSetupView';
import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { JobsListView } from './components/JobsListView';
import { CustomerHistoryView } from './components/CustomerHistoryView';
import { SpareStockView } from './components/SpareStockView';
import { PaymentsView } from './components/PaymentsView';
import { MonthlyReportsView } from './components/MonthlyReportsView';
import { OldJobsView } from './components/OldJobsView';
import { SettingsView } from './components/SettingsView';
import { NewJobModal } from './components/NewJobModal';
import { JobDetailModal } from './components/JobDetailModal';
import { QuotationModal } from './components/QuotationModal';
import { DispatchModal } from './components/DispatchModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { JobCard, CustomerMachine } from './types';
import { Flame } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, isLoading, hasOwnerAccount } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals State
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [newJobInitialProps, setNewJobInitialProps] = useState<{
    customerName?: string;
    customerPhone?: string;
    machine?: CustomerMachine | null;
  } | null>(null);
  const [activeJobDetail, setActiveJobDetail] = useState<JobCard | null>(null);
  const [activeQuotationJob, setActiveQuotationJob] = useState<JobCard | null>(null);
  const [activeDispatchJob, setActiveDispatchJob] = useState<JobCard | null>(null);

  const handleOpenNewJobWithContext = (
    customerName?: string,
    customerPhone?: string,
    machine?: CustomerMachine | null
  ) => {
    setNewJobInitialProps({ customerName, customerPhone, machine });
    setIsNewJobOpen(true);
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 shadow-2xl animate-pulse">
          <Flame className="w-9 h-9 text-slate-950" />
        </div>
        <h2 className="mt-4 font-black text-lg tracking-wider text-white">NW SERVICE CENTER</h2>
        <p className="text-xs text-amber-400 font-semibold tracking-widest uppercase mt-0.5">
          Solapur • Initializing System...
        </p>
      </div>
    );
  }

  // 1. First-time setup: Show Create Owner Account screen
  if (!hasOwnerAccount) {
    return <OwnerSetupView />;
  }

  // 2. Not logged in: Show Login screen
  if (!currentUser) {
    return <LoginView />;
  }

  // 3. Authenticated: Render Main Business Workspace
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 pb-16 lg:pb-0">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewJob={() => setIsNewJobOpen(true)}
        onToggleSidebar={() => setIsMobileNavOpen(prev => !prev)}
      />

      {/* Main Body with Sidebar Navigation */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenNewJob={() => setIsNewJobOpen(true)}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              onSelectTab={setCurrentTab}
              onOpenNewJob={() => setIsNewJobOpen(true)}
              onOpenJobDetail={job => setActiveJobDetail(job)}
            />
          )}

          {currentTab === 'all-jobs' && (
            <JobsListView
              statusFilterTab="all"
              onOpenJobDetail={job => setActiveJobDetail(job)}
              onOpenNewJob={() => setIsNewJobOpen(true)}
            />
          )}

          {currentTab === 'pending' && (
            <JobsListView
              statusFilterTab="pending"
              onOpenJobDetail={job => setActiveJobDetail(job)}
              onOpenNewJob={() => setIsNewJobOpen(true)}
            />
          )}

          {currentTab === 'repaired' && (
            <JobsListView
              statusFilterTab="repaired"
              onOpenJobDetail={job => setActiveJobDetail(job)}
              onOpenNewJob={() => setIsNewJobOpen(true)}
            />
          )}

          {currentTab === 'ready' && (
            <JobsListView
              statusFilterTab="ready"
              onOpenJobDetail={job => setActiveJobDetail(job)}
              onOpenNewJob={() => setIsNewJobOpen(true)}
            />
          )}

          {currentTab === 'dispatched' && (
            <JobsListView
              statusFilterTab="dispatched"
              onOpenJobDetail={job => setActiveJobDetail(job)}
              onOpenNewJob={() => setIsNewJobOpen(true)}
            />
          )}

          {currentTab === 'customers' && (
            <CustomerHistoryView
              onOpenJobDetail={job => setActiveJobDetail(job)}
              onOpenNewJob={handleOpenNewJobWithContext}
            />
          )}

          {currentTab === 'stock' && <SpareStockView />}

          {currentTab === 'payments' && (
            <PaymentsView onOpenJobDetail={job => setActiveJobDetail(job)} />
          )}

          {currentTab === 'reports' && <MonthlyReportsView />}

          {currentTab === 'old-jobs' && (
            <OldJobsView onOpenJobDetail={job => setActiveJobDetail(job)} />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <NewJobModal
        isOpen={isNewJobOpen}
        onClose={() => {
          setIsNewJobOpen(false);
          setNewJobInitialProps(null);
        }}
        initialCustomerName={newJobInitialProps?.customerName || ''}
        initialCustomerPhone={newJobInitialProps?.customerPhone || ''}
        initialMachine={newJobInitialProps?.machine || null}
        onJobCreated={job => {
          setActiveJobDetail(job);
          setNewJobInitialProps(null);
        }}
      />

      <JobDetailModal
        job={activeJobDetail}
        onClose={() => setActiveJobDetail(null)}
        onOpenQuotation={job => setActiveQuotationJob(job)}
        onOpenDispatch={job => setActiveDispatchJob(job)}
      />

      <QuotationModal
        job={activeQuotationJob}
        isOpen={!!activeQuotationJob}
        onClose={() => setActiveQuotationJob(null)}
      />

      <DispatchModal
        job={activeDispatchJob}
        isOpen={!!activeDispatchJob}
        onClose={() => setActiveDispatchJob(null)}
      />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
