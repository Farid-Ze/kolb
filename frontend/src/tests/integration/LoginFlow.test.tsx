/**
 * KLSI 4.0 - Login Flow Integration Test
 * Integration test untuk alur login lengkap
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock authService
vi.mock('../../services/authService', () => ({
  loginWithEmail: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper untuk render dengan providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form with all fields', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('KLSI 4.0')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /masuk/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
      expect(screen.getByText('Password wajib diisi')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /masuk/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Format email tidak valid')).toBeInTheDocument();
    });
  });

  it('should validate password minimum length', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, '12345');

    const submitButton = screen.getByRole('button', { name: /masuk/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password minimal 6 karakter')
      ).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/tampilkan password/i);

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should successfully login with valid credentials', async () => {
    const { loginWithEmail } = await import('../../services/authService');
    const mockLoginResponse = {
      access_token: 'mock-token-123',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
        created_at: '2024-01-01T00:00:00Z',
      },
    };

    vi.mocked(loginWithEmail).mockResolvedValue(mockLoginResponse);

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /masuk/i });
    await user.click(submitButton);

    // Verify loading state
    expect(screen.getByText(/memproses/i)).toBeInTheDocument();

    // Wait for login to complete
    await waitFor(() => {
      expect(loginWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    // Verify localStorage was updated
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        'mock-token-123'
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockLoginResponse.user)
      );
    });

    // Verify navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error on login failure', async () => {
    const { loginWithEmail } = await import('../../services/authService');
    vi.mocked(loginWithEmail).mockRejectedValue(
      new Error('Invalid credentials')
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /masuk/i });
    await user.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Verify no navigation occurred
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should handle network errors gracefully', async () => {
    const { loginWithEmail } = await import('../../services/authService');
    vi.mocked(loginWithEmail).mockRejectedValue(
      new Error('Network error: Unable to reach server')
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /masuk/i });
    await user.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(
        screen.getByText(/tidak dapat terhubung ke server/i)
      ).toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByLabelText(/tampilkan password/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autocomplete', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    expect(toggleButton).toHaveAttribute('aria-label');
  });
});
