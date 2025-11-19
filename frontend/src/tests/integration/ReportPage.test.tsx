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
import type { Report, ReportPercentileBand } from '../../types/api';

type MockRole = 'STUDENT' | 'MEDIATOR' | 'ADMIN';

// ---------------------------------------------------------------------------
// Mock report payload (mirror backend schema)
// ---------------------------------------------------------------------------
const responsibleUseText =
  'Kolb Learning Style Inventory (KLSI) 4.0 adalah instrumen formatif untuk refleksi dan dialog terarah bersama fasilitator; tidak boleh dipakai untuk seleksi atau diagnostik klinis.';

const mockReport: Report = {
  session_id: 1,
  raw: {
    CE: 28,
    RO: 32,
    AC: 35,
    AE: 25,
    ACCE: 7,
    AERO: -7,
    ACC_ASSM: 5,
    CONV_DIV: -3,
    BALANCE: {
      ACCE: 4,
      AERO: 6,
    },
  },
  percentiles: {
    CE: 80,
    RO: 60,
    AC: 90,
    AE: 50,
    ACCE: 70,
    AERO: 40,
    bands: {
      ACCE: 'HIGH' as ReportPercentileBand,
      AERO: 'LOW' as ReportPercentileBand,
    },
    BALANCE: {
      ACCE: 92,
      AERO: 78,
      levels: {
        ACCE: 'HIGH',
        AERO: 'MODERATE',
      },
      note: 'Heuristik jarak ke pusat normatif',
      heuristic: true,
      kind: 'heuristic_distance',
      reference: {
        centers: { ACCE: 9, AERO: 6 },
        max_distance: { ACCE: 45, AERO: 42 },
      },
    },
    source_provenance: 'DB:norm_tables',
    norm_group_used: 'EDU:University Degree',
    per_scale_provenance: {},
    per_scale_sources: {},
    used_fallback_any: false,
    raw_outside_norm_range: false,
    truncated_scales: null,
  },
  style: {
    primary_code: 'ASS',
    primary_name: 'Assimilating',
    primary_brief: 'Menyukai konsep abstrak dan refleksi',
    primary_detail: 'Fokus pada pemikiran konseptual dan observasi mendalam.',
    backup_name: 'Diverging',
    backup_code: 'DIV',
    backup_brief: 'Eksploratif dan imajinatif',
    intensity: 18,
    educator_reco: 'Mulai dengan pengalaman konkrit sebelum masuk teori',
  },
  lfi: {
    value: 0.72,
    percentile: 85,
    level: 'High',
    level_label: 'Fleksibilitas Tinggi',
  },
  visualization: {
    kite: { CE: 28, RO: 32, AC: 35, AE: 25 },
    dialectic: {
      ACCE: 7,
      AERO: -7,
      CONV_DIV: -3,
      intensity: 18,
    },
  },
  session_designs: [
    {
      code: 'ACT-01',
      title: 'Sprint Observasi',
      summary: 'Mulai dengan pengalaman lapangan lalu diskusikan refleksi.',
      activates: ['CE', 'RO'],
      duration_min: 45,
    },
  ],
  analytics: {
    predicted_lfi_curve: null,
    acc_assm_peak_note: 'Skor ACC-ASSM berada di rentang optimal.',
    meta: { heuristic: true, note: 'Model regresi publik Kolb & Kolb (2013).' },
  },
  learning_space: {
    meta: { heuristic: true, note: 'Saran berbasis heuristik ELT.' },
    suggestions: {
      items: ['Mulai sesi dengan berbagi pengalaman konkrit.', 'Tambahkan jeda refleksi sebelum analisis.'],
      is_heuristic: true,
      label: 'Heuristik • Non-normatif',
    },
    development: {
      spiral_stage: 'Integration',
      deep_learning_level: 'Interpretative',
      rationale: 'Intensity=18; LFI=0.72 menunjukkan keseimbangan.',
      disclaimer: 'Bukan diagnosis; gunakan sebagai panduan refleksi.',
      is_heuristic: true,
      label: 'Heuristik • Non-normatif',
    },
    meta_learning: {
      items: ['Catat refleksi di jurnal mingguan.', 'Latih mode AE melalui eksperimen terstruktur.'],
      is_heuristic: true,
      label: 'Heuristik • Non-normatif',
    },
    educator_roles: [
      {
        step: 1,
        role: 'Facilitator',
        focus: 'Experiential anchor',
        actions: ['Curate pengalaman konkrit', 'Ajukan pertanyaan reflektif'],
      },
    ],
  },
  notes: {
    psychometric_terms: 'ACCE dan AERO menggambarkan pergeseran preferensi antara abstraksi vs konkret dan aksi vs refleksi.',
    acc_assm_definition: 'ACC-ASSM = (AC + RO) - (AE + CE)',
    conv_div_definition: 'CONV-DIV = (AE + AC) - (CE + RO)',
    balance_definition: 'Balance menilai jarak ke pusat normatif (ACCE≈9, AERO≈6).',
    interpretation_summary: 'Gunakan hasil secara formatif bersama fasilitator.',
  },
  enhanced_analytics: null,
  responsible_use_notice: responsibleUseText,
};

const mediatorAnalyticsPayload = {
  contextual_profile: {
    context_styles: [
      {
        context: 'Starting_Something_New',
        style: 'Acting',
        ACCE: 5,
        AERO: 4,
        CE: 30,
        RO: 20,
        AC: 25,
        AE: 35,
      },
    ],
    style_frequency: { Acting: 4 },
    mode_usage: { CE: { count: 1, contexts: ['Starting_Something_New'] } },
    flexibility_pattern: 'balanced',
  },
  heatmap: {
    lfi_percentile_band: 'HIGH',
    style_matrix: { Acting: 4 },
    region_coverage: { Quadrant_I: 4 },
  },
  integrative_development: {
    predicted_score: 21.4,
    interpretation: 'Mock interpretation',
    model_info: 'Mock model',
    heuristic: true,
    note: 'Mock note',
  },
  flexibility_narrative: 'Mock narrative',
  meta: { heuristic: true, note: 'Heuristic only' },
};

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

  it('renders report header and learning style info', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /laporan hasil asesmen/i, level: 1 }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Assimilating')).toBeInTheDocument();
    expect(screen.getByText(/pemikiran konseptual/i)).toBeInTheDocument();
    expect(screen.getByText(/Norm: EDU:University Degree/)).toBeInTheDocument();
  });

  it('renders raw mode scores and percentiles', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/skor mentah/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Concrete Experience')).toBeInTheDocument();
    expect(screen.getByText('Reflective Observation')).toBeInTheDocument();
    expect(screen.getAllByText('28')[0]).toBeInTheDocument();
    expect(screen.getAllByText('80%')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sumber norm Concrete Experience/i })).toBeInTheDocument();
  });

  it('renders dialectic scores with signed values', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/skor dialektik/i)).toBeInTheDocument();
    });

    expect(screen.getByText('AC-CE')).toBeInTheDocument();
    expect(screen.getByText('+7.0')).toBeInTheDocument();
    expect(screen.getByText('-7.0')).toBeInTheDocument();
  });

  it('renders learning style scatter chart', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('learning-style-scatter')).toBeInTheDocument();
    });

    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('learning-style-x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('learning-style-y-axis')).toBeInTheDocument();
  });

  it('renders flexibility chart with LFI details', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/fleksibilitas belajar/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('lfi-bar-chart')).toBeInTheDocument();
    expect(screen.getByText(/Fleksibilitas Tinggi/i)).toBeInTheDocument();
  });

  it('shows norm provenance details', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/informasi norma/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Kelompok Norm')).toBeInTheDocument();
    expect(screen.getByText('EDU:University Degree')).toBeInTheDocument();
    expect(screen.getByText('DB:norm_tables')).toBeInTheDocument();
  });

  it('renders learning space insights and educator roles', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/learning space insights/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Spiral Stage/i)).toBeInTheDocument();
    expect(screen.getByText('Integration')).toBeInTheDocument();
    expect(screen.getByText('Facilitator')).toBeInTheDocument();
    expect(screen.getByText(/Mulai sesi dengan berbagi pengalaman/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Heuristik/i).length).toBeGreaterThan(0);
  });

  it('renders session design recommendations', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/rekomendasi sesi/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Sprint Observasi')).toBeInTheDocument();
    expect(screen.getByText(/45 menit/)).toBeInTheDocument();
  });

  it('does not render enhanced analytics for student role', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue({
      ...mockReport,
      enhanced_analytics: mediatorAnalyticsPayload,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /laporan hasil asesmen/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/Analitik Lanjutan/i)).not.toBeInTheDocument();
  });

  it('renders enhanced analytics for mediator role', async () => {
    const { getReportById } = await import('../../services/reportService');
    mockAuth.user.role = 'MEDIATOR';
    vi.mocked(getReportById).mockResolvedValue({
      ...mockReport,
      enhanced_analytics: mediatorAnalyticsPayload,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /laporan hasil asesmen/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Analitik Lanjutan/i)).toBeInTheDocument();
  });

  it('displays interpretation notes from backend', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/catatan interpretasi/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/ACC-ASSM =/i)).toBeInTheDocument();
    expect(screen.getByText(/Balance menilai jarak/i)).toBeInTheDocument();
  });

  it('renders responsible use notice supplied by backend', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/penggunaan bertanggung jawab/i)).toBeInTheDocument();
    });

    expect(screen.getByText(responsibleUseText)).toBeInTheDocument();
  });

  it('supports printing the report', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);
    const user = userEvent.setup();

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /laporan hasil asesmen/i })).toBeInTheDocument();
    });

    const printButton = screen.getByRole('button', { name: /cetak/i });
    window.print = vi.fn();
    await user.click(printButton);

    expect(window.print).toHaveBeenCalled();
  });

  it('navigates back to reports list', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);
    const user = userEvent.setup();

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /laporan hasil asesmen/i })).toBeInTheDocument();
    });

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
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /laporan hasil asesmen/i, level: 1 })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /cetak/i })).toHaveAttribute('aria-label', 'Cetak laporan');
    expect(screen.getByRole('button', { name: /pdf/i })).toHaveAttribute('aria-label');
  });

  it('marks navigation controls hidden during print', async () => {
    const { getReportById } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(mockReport);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /laporan hasil asesmen/i })).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /kembali ke beranda/i });
    expect(backButton).toHaveClass('print:hidden');
  });
});
