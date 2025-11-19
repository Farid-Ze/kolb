import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './app/providers/QueryProvider';
import { AuthProvider, type Role } from './contexts/AuthContext';
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
import { SceneController } from './scenes/SceneController';

// Dev Tools (only in development)
const AccessibilityTester = import.meta.env.DEV
  ? React.lazy(() =>
      import('./components/dev/AccessibilityTester').then((module) => ({
        default: module.AccessibilityTester,
      }))
    )
  : null;

const DesignSystemShowcasePage = import.meta.env.DEV
  ? React.lazy(() => import('./pages/DesignSystemShowcasePage'))
  : null;

type GuardOptions = {
  allowedRoles?: Role[];
  requiredRole?: Role;
  redirectTo?: string;
};

const withProtection = (
  element: React.ReactNode,
  options?: GuardOptions,
) => (
  <ProtectedRoute {...options}>
    {element}
  </ProtectedRoute>
);

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
      <QueryProvider>
        <BrowserRouter>
          <UIPreferencesProvider>
            <AuthProvider>
              {/* Toast Notification System (Task 20) */}
              <Toaster />
            
            <Routes>
          {/* Public Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          
          {/* Experience Room Route */}
          <Route path="/experience" element={<SceneController />} />

          {/* Protected Routes */}
          <Route path="/" element={withProtection(<HomePage />)} />

          {/* Assessment Flow - Phase 2 */}
          <Route
            path="/assessment/start"
            element={withProtection(<AssessmentStartPage />)}
          />

          <Route
            path="/assessment/:sessionId"
            element={withProtection(<AssessmentPage />)}
          />

          <Route
            path="/assessment/:sessionId/review"
            element={withProtection(<AssessmentReviewPage />)}
          />

          <Route
            path="/assessment/:sessionId/report"
            element={withProtection(<ReportPage />)}
          />

          <Route
            path="/reports/self"
            element={withProtection(<MyReportsPage />)}
          />

          <Route
            path="/reports/:reportId"
            element={withProtection(<ReportPage />)}
          />

          <Route
            path="/reports/shared/:shareToken"
            element={withProtection(<ReportPage />, {
              allowedRoles: ['MEDIATOR'],
            })}
          />

          <Route
            path="/teams"
            element={withProtection(<MediatorDashboardPage />, {
              allowedRoles: ['MEDIATOR'],
            })}
          />

          <Route
            path="/teams/:teamId"
            element={withProtection(<TeamDetailPage />, {
              allowedRoles: ['MEDIATOR'],
            })}
          />

          <Route
            path="/research"
            element={withProtection(<ResearchDashboardPage />, {
              allowedRoles: ['MEDIATOR'],
            })}
          />

          <Route
            path="/research/studies/:studyId"
            element={withProtection(<ResearchDetailPage />, {
              allowedRoles: ['MEDIATOR'],
            })}
          />

          {/* Dev Tools - Design System Showcase (Development only) */}
          {import.meta.env.DEV && DesignSystemShowcasePage && (
            <Route
              path="/dev/showcase"
              element={
                <Suspense fallback={null}>
                  <DesignSystemShowcasePage />
                </Suspense>
              }
            />
          )}

          {/* Unauthorized Page */}
          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="material-regular rounded-xl p-8 max-w-md text-center space-y-4">
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
            {AccessibilityTester && (
              <Suspense fallback={null}>
                <AccessibilityTester initialOpen={false} />
              </Suspense>
            )}
            </AuthProvider>
          </UIPreferencesProvider>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;