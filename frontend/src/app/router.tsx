import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AppProviders } from './providers';
import { useAuth } from '@/features/auth/context';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { AssessmentRunner } from '@/features/assessment/AssessmentRunner';
import { AssessmentIntro } from '@/features/assessment/AssessmentIntro';
import { Results } from '@/features/results/Results';

// Layouts
function RootLayout() {
    return (
        <AppProviders>
            <Outlet />
        </AppProviders>
    );
}

function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--zen-bg)]">
                <div className="animate-pulse text-[var(--zen-text-muted)]">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

function PublicRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return null; // or loading spinner
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

// Placeholder Pages
const Login = () => <div className="p-8"><h1>Login Page</h1></div>;
const Register = () => <div className="p-8"><h1>Register Page</h1></div>;
const NotFound = () => <div className="p-8"><h1>404 Not Found</h1></div>;

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: '/',
                element: <Navigate to="/dashboard" replace />,
            },
            {
                element: <PublicRoute />,
                children: [
                    { path: 'login', element: <Login /> },
                    { path: 'register', element: <Register /> },
                ],
            },
            {
                element: <ProtectedRoute />,
                children: [
                    { path: 'dashboard', element: <Dashboard /> },
                    { path: 'assessment', element: <AssessmentIntro /> },
                    { path: 'assessment/:sessionId', element: <AssessmentRunner /> },
                    { path: 'results/:sessionId', element: <Results /> },
                ],
            },
            { path: '*', element: <NotFound /> },
        ],
    },
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}
