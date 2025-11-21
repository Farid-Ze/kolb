import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MediatorDashboardPage } from '../../pages/MediatorDashboardPage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as teamService from '../../services/teamService';

// Mock teamService
vi.mock('../../services/teamService', () => ({
  getTeams: vi.fn(),
  createTeam: vi.fn(),
}));

// Mock useAuth
const mockUser = {
  id: 'mediator-1',
  name: 'Mediator Test',
  email: 'mediator@example.com',
  role: 'MEDIATOR',
};

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Telemetry
vi.mock('../../hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    trackPageView: vi.fn(),
    trackEvent: vi.fn(),
  }),
}));

const mockTeams = [
  {
    id: 1,
    name: 'Team Alpha',
    description: 'First team',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    member_count: 5,
    created_by: 'mediator-1',
  },
  {
    id: 2,
    name: 'Team Beta',
    description: 'Second team',
    created_at: '2024-01-02',
    updated_at: '2024-01-02',
    member_count: 3,
    created_by: 'mediator-1',
  },
];

const renderWithProviders = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <MediatorDashboardPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('MediatorDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(teamService.getTeams).mockResolvedValue(mockTeams);
  });

  it('renders the dashboard with team list', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Dashboard Mediator')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();

    expect(screen.getByText('First team')).toBeInTheDocument();
    expect(screen.getByText('Second team')).toBeInTheDocument();
  });

  it('filters teams based on search query', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Cari tim/i);
    await userEvent.type(searchInput, 'Alpha');

    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Team Beta')).not.toBeInTheDocument();
  });

  it('allows creating a new team', async () => {
    const newTeam = {
      id: 3,
      name: 'Team Gamma',
      description: 'New team',
      created_at: '2024-01-03',
      updated_at: '2024-01-03',
      member_count: 0,
      created_by: 'mediator-1',
    };

    vi.mocked(teamService.createTeam).mockResolvedValue(newTeam);

    renderWithProviders();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Dashboard Mediator')).toBeInTheDocument();
    });

    // Open modal
    const createButton = screen.getByRole('button', { name: /Buat Tim/i });
    await userEvent.click(createButton);

    expect(screen.getByText('Buat Tim Baru')).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByLabelText(/Nama Tim/i);
    const descInput = screen.getByLabelText(/Deskripsi \(Opsional\)/i);

    await userEvent.type(nameInput, 'Team Gamma');
    await userEvent.type(descInput, 'New team');

    // Submit
    const buttons = screen.getAllByRole('button', { name: 'Buat Tim' });
    const submitButton = buttons[1]; // The one in the modal
    await userEvent.click(submitButton);

    await waitFor(() => {
      const calls = vi.mocked(teamService.createTeam).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toEqual({
        name: 'Team Gamma',
        description: 'New team',
      });
    });

    // Should close modal (check if title is gone or check for toast)
    // Since we mock getTeams, we won't see the new team in the list unless we update the mock implementation
    // But we verified the mutation was called.
  });
});
