/**
 * KLSI 4.0 - Report Page Integration Test
 * Integration test untuk halaman laporan hasil assessment
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReportPage } from '../../pages/ReportPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock data
const mockReport = {
  report_id: 'report-1',
  session_id: '1',
  user_id: 'user-1',
  instrument_id: 'KLSI',
  generated_at: '2024-01-15T10:00:00Z',
  raw_scores: { CE: 28, RO: 32, AC: 35, AE: 25 },
  dialectic_scores: { 'AC-CE': 7, 'AE-RO': -7 },
  learning_style: { style_code: 'ASS', style_name: 'Assimilator', quadrant: 2, description: 'Anda cenderung untuk berpikir abstrak.' },
  nine_style: { style_code: 'ASS-1', style_name: 'Assimilator', description: 'No detail' },
  flexibility: { lfi_score: 72, category: 'High', interpretation: 'High flexibility' },
  norm_group: { norm_name: 'Mahasiswa Indonesia', sample_size: 1500, description: 'Norma nasional' },
  percentile_scores: { CE: 80, RO: 60, AC: 90, AE: 50, 'AC-CE': 70, 'AE-RO': 40 },
  per_scale_provenance: {},
  delta: null,
};

// Mock services
vi.mock('../../services/reportService', () => {
  const getReport = vi.fn();
  return {
    getReport,
    getReportById: getReport,
  };
});

// Mock useAuth
const mockAuth = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'STUDENT',
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
const renderWithProviders = (reportId: string = 'report-1') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/report/${reportId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/report/:reportId" element={<ReportPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Report Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/report/report-1');
  });

  it('should render loading state initially', async () => {
    const { getReport } = await import('../../services/reportService');
      vi.mocked(getReport).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockReport), 100)
        )
    );

    renderWithProviders();

    expect(screen.getByText(/memuat laporan/i)).toBeInTheDocument();
  });

  it('should load and display report data', async () => {
    const { getReport } = await import('../../services/reportService');
      vi.mocked(getReport).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Laporan Hasil Asesmen')).toBeInTheDocument();
    });

    // Verify learning style is displayed
    expect(screen.getByText('Assimilator')).toBeInTheDocument();
    expect(
      screen.getByText(/cenderung untuk berpikir abstrak/i)
    ).toBeInTheDocument();
  });

  it('should display raw scores', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Skor Mentah')).toBeInTheDocument();
    });

    expect(screen.getByText('CE: 28')).toBeInTheDocument();
    expect(screen.getByText('RO: 32')).toBeInTheDocument();
    expect(screen.getByText('AC: 35')).toBeInTheDocument();
    expect(screen.getByText('AE: 25')).toBeInTheDocument();
  });

  it('should display dialectic scores', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Skor Dialektik')).toBeInTheDocument();
    });

    expect(screen.getByText(/AC-CE: 7/i)).toBeInTheDocument();
    expect(screen.getByText(/AE-RO: -7/i)).toBeInTheDocument();
  });

  it('should render learning style chart', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });

    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  it('should render flexibility chart', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Fleksibilitas Belajar')).toBeInTheDocument();
    });

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should display norm group information', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Kelompok Norma')).toBeInTheDocument();
    });

    expect(screen.getByText('Mahasiswa Indonesia')).toBeInTheDocument();
    expect(screen.getByText(/1500/)).toBeInTheDocument();
  });

  it('should display longitudinal delta when present', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue({
      ...mockReport,
      delta: { delta_acce: 2.0, delta_aero: -1.0, delta_lfi: 0.05, previous_session_id: 999, previous_session_date: '2024-01-01T00:00:00Z' },
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/perubahan dari asesmen sebelumnya/i)).toBeDefined();
    });

    expect(screen.queryByText('+2.0')).toBeTruthy();
    expect(screen.queryByText('-1.0')).toBeTruthy();
    expect(screen.queryByText('+0.1')).toBeTruthy(); // LFI formatted
  });

  it('should display responsible use notice', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Penggunaan Bertanggung Jawab')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/hasil ini adalah snapshot dari preferensi belajar/i)
    ).toBeInTheDocument();
  });

  it('should have print functionality', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Laporan Hasil Asesmen')).toBeInTheDocument();
    });

    const printButton = screen.getByRole('button', { name: /cetak/i });
    expect(printButton).toBeInTheDocument();

    // Mock window.print
    window.print = vi.fn();
    await user.click(printButton);

    expect(window.print).toHaveBeenCalled();
  });

  it('should have back button that navigates to reports list', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Laporan Hasil Asesmen')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /kembali/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/reports');
  });

  it('should handle API errors gracefully', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockRejectedValue(
      new Error('Failed to load report')
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to load report')
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', {
      name: /kembali/i,
    });
    expect(backButton).toBeInTheDocument();
  });

  it('should handle 404 not found error', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockRejectedValue(
      new Error('Report not found')
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/tidak ditemukan/i)).toBeInTheDocument();
    });
  });

  it('should poll for report if status is pending', async () => {
    const { getReportById } = await import('../../services/reportService');
    
    // First call returns pending status
    const pendingReport = {
      ...mockReport,
      status: 'PENDING',
      scores: null,
    };

    vi.mocked(getReportById)
      .mockResolvedValueOnce(pendingReport)
      .mockResolvedValueOnce(mockReport);

    renderWithProviders();

    // Should show processing message
    await waitFor(() => {
      expect(screen.getByText(/memproses hasil/i)).toBeInTheDocument();
    });

    // Should eventually show completed report
    await waitFor(
      () => {
        expect(screen.getByText('Assimilator')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should have proper accessibility attributes', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Laporan Hasil Asesmen')).toBeInTheDocument();
    });

    // Check for heading hierarchy
    const mainHeading = screen.getByRole('heading', {
      name: /laporan hasil asesmen/i,
      level: 1,
    });
    expect(mainHeading).toBeInTheDocument();

    // Check for section headings
    const scoreHeading = screen.getByRole('heading', {
      name: /skor mentah/i,
    });
    expect(scoreHeading).toBeInTheDocument();

    // Check buttons have proper labels
    const printButton = screen.getByRole('button', { name: /cetak/i });
    expect(printButton).toHaveAttribute('aria-label');
  });

  it('should be responsive to print media query', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Laporan Hasil Asesmen')).toBeInTheDocument();
    });

    // In print mode, navigation elements should be hidden
    // This would require checking computed styles in a real browser
    // For vitest, we verify the CSS classes are present
    const backButton = screen.getByRole('button', { name: /kembali/i });
    expect(backButton).toHaveClass('print:hidden');
  });
});
