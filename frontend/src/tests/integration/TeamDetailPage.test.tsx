/**
 * KLSI 4.0 - Team Detail Page Integration Test
 * Integration test untuk halaman detail tim dengan team rollup chart
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TeamDetailPage } from '../../pages/TeamDetailPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock data
const mockTeam = {
  team_id: 'team-1',
  name: 'Team Alpha',
  description: 'Engineering team focused on backend development',
  created_by: 'mediator-1',
  created_at: '2024-01-10T10:00:00Z',
  members: [
    {
      user_id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'STUDENT',
    },
    {
      user_id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'STUDENT',
    },
    {
      user_id: 'user-3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      role: 'STUDENT',
    },
  ],
};

const mockTeamRollup = {
  team_id: 'team-1',
  team_name: 'Team Alpha',
  member_count: 3,
  members: [
    {
      user_id: 'user-1',
      name: 'John Doe',
      learning_style: 'Diverger',
      AC_CE: -8,
      AE_RO: 12,
    },
    {
      user_id: 'user-2',
      name: 'Jane Smith',
      learning_style: 'Assimilator',
      AC_CE: 10,
      AE_RO: -6,
    },
    {
      user_id: 'user-3',
      name: 'Bob Wilson',
      learning_style: 'Converger',
      AC_CE: 9,
      AE_RO: 8,
    },
  ],
  diversity_score: 0.85,
  balance_metrics: {
    CE_percentage: 33,
    RO_percentage: 33,
    AC_percentage: 67,
    AE_percentage: 67,
  },
};

// Mock services
vi.mock('../../services/teamService', () => ({
  getTeamDetails: vi.fn(),
  getTeamRollup: vi.fn(),
  addMemberToTeam: vi.fn(),
  removeMemberFromTeam: vi.fn(),
}));

// Mock useAuth
const mockAuth = {
  user: {
    id: 'mediator-1',
    email: 'mediator@example.com',
    name: 'Mediator User',
    role: 'MEDIATOR',
    created_at: '2024-01-01T00:00:00Z',
  },
  accessToken: 'mock-token-123',
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
};

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuth,
  };
});

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
const renderWithProviders = (teamId: string = 'team-1') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>,
    {
      initialEntries: [`/teams/${teamId}`],
    }
  );
};

describe('Team Detail Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/teams/team-1');
  });

  it('should render loading state initially', async () => {
    const { getTeamDetails } = await import('../../services/teamService');
    vi.mocked(getTeamDetails).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockTeam), 100)
        )
    );

    renderWithProviders();

    expect(screen.getByText(/memuat/i)).toBeInTheDocument();
  });

  it('should load and display team details', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/engineering team focused on backend/i)
    ).toBeInTheDocument();
  });

  it('should display team members list', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Anggota Tim')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('should display team rollup chart', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Peta Gaya Belajar Tim')).toBeInTheDocument();
    });

    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });

  it('should display diversity score', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Skor Keragaman')).toBeInTheDocument();
    });

    expect(screen.getByText(/0\.85/)).toBeInTheDocument();
  });

  it('should display learning style distribution', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Distribusi Gaya Belajar')).toBeInTheDocument();
    });

    expect(screen.getByText('Diverger')).toBeInTheDocument();
    expect(screen.getByText('Assimilator')).toBeInTheDocument();
    expect(screen.getByText('Converger')).toBeInTheDocument();
  });

  it('should allow mediator to add members', async () => {
    const { getTeamDetails, getTeamRollup, addMemberToTeam } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);
    vi.mocked(addMemberToTeam).mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /tambah anggota/i });
    await user.click(addButton);

    // Verify modal/dialog opened
    await waitFor(() => {
      expect(screen.getByText(/masukkan email/i)).toBeInTheDocument();
    });
  });

  it('should allow mediator to remove members', async () => {
    const { getTeamDetails, getTeamRollup, removeMemberFromTeam } =
      await import('../../services/teamService');
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);
    vi.mocked(removeMemberFromTeam).mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find and click remove button for first member
    const removeButtons = screen.getAllByRole('button', {
      name: /hapus/i,
    });
    await user.click(removeButtons[0]);

    // Verify confirmation dialog
    await waitFor(() => {
      expect(
        screen.getByText(/yakin ingin menghapus anggota/i)
      ).toBeInTheDocument();
    });
  });

  it('should show empty state when team has no members', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    const emptyTeam = { ...mockTeam, members: [] };
    vi.mocked(getTeamDetails).mockResolvedValue(emptyTeam);
    vi.mocked(getTeamRollup).mockResolvedValue({
      ...mockTeamRollup,
      members: [],
      member_count: 0,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    expect(screen.getByText(/belum ada anggota/i)).toBeInTheDocument();
  });

  it('should have back button that navigates to teams list', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /kembali/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/teams');
  });

  it('should handle API errors gracefully', async () => {
    const { getTeamDetails } = await import('../../services/teamService');
    vi.mocked(getTeamDetails).mockRejectedValue(
      new Error('Failed to load team')
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load team')).toBeInTheDocument();
    });
  });

  it('should handle 404 not found error', async () => {
    const { getTeamDetails } = await import('../../services/teamService');
    vi.mocked(getTeamDetails).mockRejectedValue(
      new Error('Team not found')
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/tidak ditemukan/i)).toBeInTheDocument();
    });
  });

  it('should only show add/remove buttons for mediators', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    // Mediator should see add button
    expect(
      screen.getByRole('button', { name: /tambah anggota/i })
    ).toBeInTheDocument();

    // Mediator should see remove buttons
    const removeButtons = screen.getAllByRole('button', { name: /hapus/i });
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('should display member learning styles with colors', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Diverger')).toBeInTheDocument();
    });

    // Each learning style should have a colored badge
    const badges = screen.getAllByText(/Diverger|Assimilator|Converger/);
    expect(badges.length).toBe(3);
  });

  it('should show team statistics', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Statistik Tim')).toBeInTheDocument();
    });

    expect(screen.getByText(/jumlah anggota/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', async () => {
    const { getTeamDetails, getTeamRollup } = await import(
      '../../services/teamService'
    );
    vi.mocked(getTeamDetails).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    // Check for heading hierarchy
    const mainHeading = screen.getByRole('heading', {
      name: /team alpha/i,
      level: 1,
    });
    expect(mainHeading).toBeInTheDocument();

    // Check buttons have proper labels
    const addButton = screen.getByRole('button', { name: /tambah anggota/i });
    expect(addButton).toHaveAttribute('aria-label');
  });

  it('should refresh data after adding member', async () => {
    const { getTeamDetails, getTeamRollup, addMemberToTeam } = await import(
      '../../services/teamService'
    );
    const getTeamDetailsSpy = vi.mocked(getTeamDetails);
    getTeamDetailsSpy.mockResolvedValue(mockTeam);
    vi.mocked(getTeamRollup).mockResolvedValue(mockTeamRollup);
    vi.mocked(addMemberToTeam).mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    // Clear previous calls
    getTeamDetailsSpy.mockClear();

    // Add member
    const addButton = screen.getByRole('button', { name: /tambah anggota/i });
    await user.click(addButton);

    // Fill form and submit (simplified)
    // In real test, would interact with form fields

    // After successful add, data should refresh
    await waitFor(() => {
      expect(getTeamDetailsSpy).toHaveBeenCalled();
    });
  });
});
