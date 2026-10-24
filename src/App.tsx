import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { BrowseItemsPage } from './pages/BrowseItemsPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AiInfoPage } from './pages/AiInfoPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AuthPage } from './pages/AuthPage';
import { ReportLostModal } from './components/items/ReportLostModal';
import { ReportFoundModal } from './components/items/ReportFoundModal';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<any>({});
  const [reportLostOpen, setReportLostOpen] = useState(false);
  const [reportFoundOpen, setReportFoundOpen] = useState(false);

  const navigateTo = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportCreated = (newReportId: string) => {
    setReportLostOpen(false);
    setReportFoundOpen(false);
    navigateTo('item-detail', { reportId: newReportId });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-primary-100 selection:text-primary-900">
      
      {/* Main Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        onOpenReportLost={() => setReportLostOpen(true)}
        onOpenReportFound={() => setReportFoundOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={navigateTo}
            onOpenReportLost={() => setReportLostOpen(true)}
            onOpenReportFound={() => setReportFoundOpen(true)}
          />
        )}

        {currentPage === 'browse' && (
          <BrowseItemsPage
            onNavigate={navigateTo}
            onOpenReportLost={() => setReportLostOpen(true)}
            onOpenReportFound={() => setReportFoundOpen(true)}
          />
        )}

        {currentPage === 'item-detail' && (
          <ItemDetailPage
            reportId={pageParams.reportId}
            onNavigate={navigateTo}
            onOpenReportLost={() => setReportLostOpen(true)}
          />
        )}

        {currentPage === 'student-dashboard' && (
          <StudentDashboardPage
            onNavigate={navigateTo}
            onOpenReportLost={() => setReportLostOpen(true)}
            onOpenReportFound={() => setReportFoundOpen(true)}
          />
        )}

        {currentPage === 'admin-dashboard' && (
          <AdminDashboardPage
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'ai-info' && (
          <AiInfoPage />
        )}

        {currentPage === 'how-it-works' && (
          <HowItWorksPage
            onNavigate={navigateTo}
            onOpenReportLost={() => setReportLostOpen(true)}
            onOpenReportFound={() => setReportFoundOpen(true)}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onSuccess={() => navigateTo('student-dashboard')}
          />
        )}
      </main>

      {/* Global Modals */}
      {reportLostOpen && (
        <ReportLostModal
          onClose={() => setReportLostOpen(false)}
          onSuccess={handleReportCreated}
          onRequireAuth={() => {
            setReportLostOpen(false);
            navigateTo('auth');
          }}
        />
      )}

      {reportFoundOpen && (
        <ReportFoundModal
          onClose={() => setReportFoundOpen(false)}
          onSuccess={handleReportCreated}
          onRequireAuth={() => {
            setReportFoundOpen(false);
            navigateTo('auth');
          }}
        />
      )}

      {/* Global Footer */}
      <Footer onNavigate={navigateTo} />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
