import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

interface MockAuthUser {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'MEDIATOR' | 'ADMIN';
  created_at: string;
}

interface MockAuthValue {
  user: MockAuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void> | void;
  logout: () => void;
  refreshToken: () => Promise<void> | void;
  setAuthData: (token: string, user: MockAuthUser) => void;
}

const buildAuthValue = (overrides: Partial<MockAuthValue> = {}): MockAuthValue => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  setAuthData: vi.fn(),
  ...overrides,
});

const mockUseAuth = vi.fn<() => MockAuthValue>(() => buildAuthValue());

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(buildAuthValue());
  });

  it('redirects unauthenticated users to login', () => {
    mockUseAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: false,
        user: null,
      }),
    );

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>Private</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when role passes guard', () => {
    mockUseAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'mediator@example.com',
          name: 'Mediator',
          role: 'MEDIATOR',
          created_at: new Date().toISOString(),
        },
      }),
    );

    render(
      <MemoryRouter initialEntries={['/mediator']}>
        <Routes>
          <Route
            path="/mediator"
            element={
              <ProtectedRoute allowedRoles={['MEDIATOR']}>
                <div>Mediator Area</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Mediator Area')).toBeInTheDocument();
  });

  it('blocks access when role not allowed', () => {
    mockUseAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        user: {
          id: '2',
          email: 'student@example.com',
          name: 'Student',
          role: 'STUDENT',
          created_at: new Date().toISOString(),
        },
      }),
    );

    render(
      <MemoryRouter initialEntries={['/teams']}>
        <Routes>
          <Route
            path="/teams"
            element={
              <ProtectedRoute allowedRoles={['MEDIATOR']}>
                <div>Teams</div>
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<div>Denied</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Denied')).toBeInTheDocument();
  });

  it('supports multi-role guards', () => {
    mockUseAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        user: {
          id: '3',
          email: 'admin@example.com',
          name: 'Admin',
          role: 'ADMIN',
          created_at: new Date().toISOString(),
        },
      }),
    );

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route
            path="/shared"
            element={
              <ProtectedRoute allowedRoles={['MEDIATOR', 'ADMIN']}>
                <div>Shared Area</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Shared Area')).toBeInTheDocument();
  });
});
