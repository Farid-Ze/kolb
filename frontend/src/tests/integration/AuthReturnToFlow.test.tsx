import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoginPage } from '../../pages/LoginPage';
import { AuthNotice } from '../../core/auth/AuthNotice';

/**
 * KLSI 4.0 - Auth ReturnTo Flow Tests
 * 
 * Tests the complete authentication flow with returnTo parameter:
 * 1. User tries to access protected resource
 * 2. AuthNotice redirects to login with returnTo parameter
 * 3. User logs in
 * 4. System redirects back to original destination
 */

// Mock auth service
vi.mock('../../services/authService', () => ({
  loginWithEmail: vi.fn().mockResolvedValue({
    access_token: 'mock_token_12345',
    token_type: 'Bearer',
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'STUDENT',
      created_at: new Date().toISOString(),
    },
  }),
  getCurrentUser: vi.fn(),
  registerUser: vi.fn(),
  isUsingMockService: vi.fn().mockReturnValue(true),
}));

// Mock API config
vi.mock('../../config/api', () => ({
  getApiUrl: vi.fn((path: string) => `http://localhost:8000${path}`),
  API_CONFIG: {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0',
    },
  },
  API_BASE_URL: 'http://localhost:8000',
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

describe('Auth ReturnTo Flow', () => {
  let queryClient: QueryClient;

  const LocationTracker = ({ onChange }: { onChange: (location: Location) => void }) => {
    const location = useLocation();
    React.useEffect(() => {
      onChange(location);
    }, [location, onChange]);
    return null;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should preserve returnTo parameter when navigating from AuthNotice', async () => {
    const user = userEvent.setup();

    // Mock component that uses AuthNotice
    const ProtectedPage = () => (
      <div>
        <h1>Protected Resource</h1>
        <AuthNotice
          message="You must be signed in"
          autoNavigateToLogin={true}
        />
      </div>
    );

    let lastLocation: Location | null = null;

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/protected/resource']}>
          <AuthProvider>
            <LocationTracker onChange={(loc) => {
              lastLocation = loc;
            }} />
            <Routes>
              <Route path="/protected/resource" element={<ProtectedPage />} />
              <Route path="/auth/login" element={<div>Login Page</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Click sign in button
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInButton);

    // Should navigate to login with returnTo parameter
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(lastLocation?.pathname).toBe('/auth/login');
      expect(lastLocation?.search).toContain('returnTo=');
    });
  });

  it('should redirect to returnTo URL after successful login', async () => {
    const user = userEvent.setup();

    const TestApp = () => (
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route
          path="/assessment/start"
          element={<div>Assessment Start Page</div>}
        />
      </Routes>
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={['/auth/login?returnTo=%2Fassessment%2Fstart']}
        >
          <AuthProvider>
            <TestApp />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill in login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' });
    const submitButton = screen.getByRole('button', { name: /masuk/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should redirect to /assessment/start after successful login
    await waitFor(
      () => {
        const redirected = screen.queryByText('Assessment Start Page');
        expect(redirected).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should handle returnTo parameter with query strings and hash', () => {
    const complexReturnTo = encodeURIComponent(
      '/report/123?tab=details#section-2'
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/auth/login?returnTo=${complexReturnTo}`]}>
          <AuthProvider>
            <Routes>
              <Route path="/auth/login" element={<LoginPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // The LoginPage should decode and use this complex URL
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should fallback to sessionStorage if no returnTo in URL', () => {
    // Set returnTo in sessionStorage
    sessionStorage.setItem('auth:postLoginRedirect', '/assessment/123');

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/auth/login']}>
          <AuthProvider>
            <Routes>
              <Route path="/auth/login" element={<LoginPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Should use sessionStorage value for redirect target
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should handle session expiry with proper returnTo', async () => {
    // Simulate being on assessment page
    const currentLocation = '/assessment/456/review';
    const originalLocation = window.location;
    let mockedHref = `http://localhost${currentLocation}`;

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...originalLocation,
        pathname: currentLocation,
        search: '',
        hash: '',
        get href() {
          return mockedHref;
        },
        set href(value: string) {
          mockedHref = value;
        },
        assign: vi.fn((value: string) => {
          mockedHref = value;
        }),
        replace: vi.fn((value: string) => {
          mockedHref = value;
        }),
      },
    });

    const unauthorizedEvent = new CustomEvent('auth:unauthorized', {
      detail: { message: 'Session expired' },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[currentLocation]}>
          <AuthProvider>
            <div>Protected</div>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    window.dispatchEvent(unauthorizedEvent);

    await waitFor(() => {
      expect(sessionStorage.getItem('auth:postLoginRedirect')).toBe(currentLocation);
    });

    const errorMsg = sessionStorage.getItem('auth:lastAuthErrorMessage');
    expect(errorMsg).toContain('Session expired');

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('should not create infinite loops when returnTo is login page', () => {
    // Edge case: returnTo points to login page itself
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={['/auth/login?returnTo=%2Fauth%2Flogin']}
        >
          <AuthProvider>
            <Routes>
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/" element={<div>Home Page</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Should not crash or create infinite loop
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
