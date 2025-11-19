/**
 * KLSI 4.0 - Report Page Integration Test
 * Memastikan halaman laporan mengikuti payload backend terbaru.
 */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ReportPage } from '../../pages/ReportPage';
import { AuthProvider } from '../../contexts/AuthContext';
import type { Report } from '../../types/api';
import { getSampleReport, buildMinimalReport } from '../fixtures/reportSample';

type MockRole = 'STUDENT' | 'MEDIATOR' | 'ADMIN';

// ---------------------------------------------------------------------------
// Mock report payload (mirror backend schema)
// ---------------------------------------------------------------------------
const SAMPLE_REPORT = getSampleReport();
const responsibleUseText =
  SAMPLE_REPORT.responsible_use_notice ??
  'Laporan ini bersifat formatif dan tidak menggantikan penilaian profesional.';

const buildFullReport = (): Report => getSampleReport();

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------
vi.mock('../../services/reportService', () => {
  const getReport = vi.fn();
  return {
    getReport,
    getReportById: getReport,
  };
});

const mockAuth = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'STUDENT' as MockRole,
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
  const actual = await vi.importActual<typeof import('../../contexts/AuthContext')>(
    '../../contexts/AuthContext',
  );
  return {
    ...actual,
    useAuth: () => mockAuth,
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper render
const renderWithProviders = (reportId: string = '1') => {
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
const loadReportPage = async (payload: Report) => {
  const { getReportById } = await import('../../services/reportService');
  vi.mocked(getReportById).mockResolvedValue(payload);
  renderWithProviders();
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /laporan hasil asesmen/i })).toBeInTheDocument();
  });
};

describe('Report Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/report/1');
    mockAuth.user.role = 'STUDENT';
  });

  it('shows loading state while fetching report', async () => {
    const { getReportById } = await import('../../services/reportService');
    const pendingPromise = new Promise<Report>(() => {});
    vi.mocked(getReportById).mockReturnValue(pendingPromise);

    renderWithProviders();

    expect(screen.getByText(/memproses laporan/i)).toBeInTheDocument();
    expect(screen.getByText(/memuat laporan/i)).toBeInTheDocument();
  });

  it('renders report header and learning style info from sample payload', async () => {
    await loadReportPage(buildFullReport());

    expect(screen.getAllByText('Berpikir Analitis')).toHaveLength(2);
    expect(screen.getAllByText(/Ringkasan gaya/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Norm: EDU:University Degree/)).toBeInTheDocument();
  });

  it('renders raw mode scores and percentiles using sample data', async () => {
    await loadReportPage(buildFullReport());

    await waitFor(() => {
      expect(screen.getByText(/skor mentah/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Concrete Experience')).toBeInTheDocument();
    expect(screen.getByText('Reflective Observation')).toBeInTheDocument();
    expect(screen.getAllByText('44')[0]).toBeInTheDocument();
    expect(screen.getAllByText('89%')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sumber norm Concrete Experience/i })).toBeInTheDocument();
  });

  it('renders dialectic scores with signed values from sample payload', async () => {
    await loadReportPage(buildFullReport());

    await waitFor(() => {
      expect(screen.getAllByText(/skor dialektik/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText('AC-CE')).toBeInTheDocument();
    expect(screen.getByText('AE-RO')).toBeInTheDocument();
    expect(screen.getAllByText('-16.0')).toHaveLength(2);
  });

  it('renders learning style scatter chart', async () => {
    await loadReportPage(buildFullReport());

    await waitFor(() => {
      expect(screen.getByTestId('learning-style-scatter')).toBeInTheDocument();
    });

    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('learning-style-x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('learning-style-y-axis')).toBeInTheDocument();
  });

  it('renders flexibility chart with LFI details', async () => {
    await loadReportPage(buildFullReport());

    await waitFor(() => {
      expect(screen.getByText(/fleksibilitas belajar/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('lfi-bar-chart')).toBeInTheDocument();
    expect(screen.getAllByText(/Fleksibilitas tinggi/i).length).toBeGreaterThan(0);
  });

  it('surfaces norm provenance and fallback info', async () => {
    await loadReportPage(buildFullReport());

    await waitFor(() => {
      expect(screen.getByText(/informasi norma/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Kelompok Norm')).toBeInTheDocument();
    expect(screen.getAllByText('EDU:University Degree').length).toBeGreaterThan(0);
    expect(screen.getByText('Ya, menggunakan fallback')).toBeInTheDocument();
  });

  it('renders learning space insights with heuristic labels from sample', async () => {
    await loadReportPage(buildFullReport());

    await waitFor(() => {
      expect(screen.getByText(/learning space insights/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Spiral Stage/i)).toBeInTheDocument();
    expect(screen.getByText('Specialization')).toBeInTheDocument();
    expect(screen.getByText('Facilitator')).toBeInTheDocument();
    expect(screen.getByText(/Fasilitasi refleksi sebelum analisis/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Heuristik/i).length).toBeGreaterThan(0);
  });

  it('renders session design recommendations from sample payload', async () => {
    await loadReportPage(buildFullReport());

    await waitFor(() => {
      expect(screen.getByText(/rekomendasi sesi/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Gallery Walk')).toBeInTheDocument();
    expect(screen.getByText(/45 menit/)).toBeInTheDocument();
  });

  it('hides enhanced analytics for student role even when payload present', async () => {
    await loadReportPage(buildFullReport());

    expect(screen.queryByText(/Analitik Lanjutan/i)).not.toBeInTheDocument();
  });

  it('renders enhanced analytics for mediator role', async () => {
    mockAuth.user.role = 'MEDIATOR';
    await loadReportPage(buildFullReport());

    expect(screen.getByText(/Analitik Lanjutan/i)).toBeInTheDocument();
  });

  it('displays interpretation notes from backend sample', async () => {
    await loadReportPage(buildFullReport());

    await waitFor(() => {
      expect(screen.getByText(/catatan interpretasi/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Definisi ACC-ASSM/i)).toBeInTheDocument();
    expect(screen.getByText(/Definisi BAL/i)).toBeInTheDocument();
  });

  it('renders responsible use notice supplied by backend', async () => {
    await loadReportPage(buildFullReport());

    await waitFor(() => {
      expect(screen.getByText(/penggunaan bertanggung jawab/i)).toBeInTheDocument();
    });

    expect(screen.getByText(responsibleUseText)).toBeInTheDocument();
  });

  it('supports printing the report', async () => {
    const user = userEvent.setup();
    await loadReportPage(buildFullReport());

    const printButton = screen.getByRole('button', { name: /cetak/i });
    window.print = vi.fn();
    await user.click(printButton);

    expect(window.print).toHaveBeenCalled();
  });

  it('navigates back to reports list', async () => {
    const user = userEvent.setup();
    await loadReportPage(buildFullReport());

    const backButton = screen.getByRole('button', { name: /kembali/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/reports');
  });

  it('handles API errors gracefully', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockRejectedValue(new Error('Failed to load report'));

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load report')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /kembali ke beranda/i })).toBeInTheDocument();
  });

  it('shows friendly not found message for 404 errors', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockRejectedValue(new Error('Report not found'));

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/laporan tidak ditemukan/i)).toBeInTheDocument();
    });
  });

  it('applies accessibility attributes to headings and actions', async () => {
    await loadReportPage(buildFullReport());

    expect(screen.getByRole('button', { name: /cetak/i })).toHaveAttribute('aria-label', 'Cetak laporan');
    expect(screen.getByRole('button', { name: /pdf/i })).toHaveAttribute('aria-label');
  });

  it('marks navigation controls hidden during print', async () => {
    await loadReportPage(buildFullReport());

    const backButton = screen.getByRole('button', { name: /kembali ke beranda/i });
    expect(backButton).toHaveClass('print:hidden');
  });

  it('renders fallback copy when backend returns minimal payload', async () => {
    await loadReportPage(buildMinimalReport());

    expect(screen.getByText(/Data gaya belajar belum tersedia/i)).toBeInTheDocument();
    expect(screen.getByText(/Norm: Tidak tersedia/i)).toBeInTheDocument();
    expect(screen.getByText(/penggunaan bertanggung jawab/i)).toBeInTheDocument();
  });
});
