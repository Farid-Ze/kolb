import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/api';
import { AuthProvider } from './contexts/AuthContext';
import { UIPreferencesProvider } from './contexts/UIPreferencesContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Toaster } from 'sonner';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { AssessmentStartPage } from './pages/AssessmentStartPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { AssessmentReviewPage } from './pages/AssessmentReviewPage';
import { ReportPage } from './pages/ReportPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { MediatorDashboardPage } from './pages/MediatorDashboardPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { ResearchDashboardPage } from './pages/ResearchDashboardPage';
import { ResearchDetailPage } from './pages/ResearchDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Dev Tools (only in development)
const AccessibilityTester = process.env.NODE_ENV === 'development'
  ? require('./components/dev/AccessibilityTester').AccessibilityTester
  : null;

const DesignSystemShowcasePage = process.env.NODE_ENV === 'development'
  ? require('./pages/DesignSystemShowcasePage').default
  : null;

/**
 * KLSI 4.0 - Aplikasi Tes Psikometri Learning Style Inventory
 * Implementasi "Liquid Glass" Design System
 * 
 * Phase 1-6: Complete Implementation
 * Task 6: Inisialisasi React Router
 * Task 12-13: AuthProvider dan useAuth
 * Task 26-38: Assessment Pages
 * Task 81-92: UI Kit & Design System (Phase 6)
 */

const App: React.FC = () => {
  // Detect system theme preference
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <UIPreferencesProvider>
            <AuthProvider>
              {/* Toast Notification System (Task 20) */}
              <Toaster />
            
            <Routes>
          {/* Public Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Assessment Flow - Phase 2 */}
          <Route
            path="/assessment/start"
            element={
              <ProtectedRoute>
                <AssessmentStartPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessment/:sessionId"
            element={
              <ProtectedRoute>
                <AssessmentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessment/:sessionId/review"
            element={
              <ProtectedRoute>
                <AssessmentReviewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessment/:sessionId/report"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/self"
            element={
              <ProtectedRoute>
                <MyReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teams"
            element={
              <ProtectedRoute requiredRole="MEDIATOR">
                <MediatorDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teams/:teamId"
            element={
              <ProtectedRoute requiredRole="MEDIATOR">
                <TeamDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/research"
            element={
              <ProtectedRoute requiredRole="MEDIATOR">
                <ResearchDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/research/studies/:studyId"
            element={
              <ProtectedRoute requiredRole="MEDIATOR">
                <ResearchDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Dev Tools - Design System Showcase (Development only) */}
          {DesignSystemShowcasePage && (
            <Route path="/dev/showcase" element={<DesignSystemShowcasePage />} />
          )}

          {/* Unauthorized Page */}
          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="glass-regular rounded-xl p-8 max-w-md text-center space-y-4">
                  <h2>Akses Ditolak</h2>
                  <p className="text-muted-foreground">
                    Anda tidak memiliki izin untuk mengakses halaman ini.
                  </p>
                  <button
                    onClick={() => window.history.back()}
                    className="rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:opacity-90"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
            {/* Dev Tools - Task TODO2.md Phase 5.12 */}
            {AccessibilityTester && <AccessibilityTester initialOpen={false} />}
            </AuthProvider>
          </UIPreferencesProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;