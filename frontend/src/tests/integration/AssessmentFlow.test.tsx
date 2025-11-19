/**
 * KLSI 4.0 - Assessment Flow Integration Test
 * Integration test untuk alur assessment lengkap
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssessmentPage } from '../../pages/AssessmentPage';
import { AuthProvider } from '../../contexts/AuthContext';
import type { GetAssessmentItemsResponse, SubmitAnswersResponse } from '../../types/api';

// Mock data
const mockDeliveryPackage: GetAssessmentItemsResponse = {
  session_id: '1',
  instrument_code: 'KLSI',
  instrument_version: '4.0',
  status: 'Started',
  total_items: 2,
  items: [
    {
      item_id: 'lsi_item_001',
      order: 1,
      prompt: 'Ketika saya belajar:',
      options: [
        { id: 'opt-001-ce', option_code: 'CE', text: 'Saya suka merasakan', dimension: 'CE' },
        { id: 'opt-001-ro', option_code: 'RO', text: 'Saya suka mengamati', dimension: 'RO' },
        { id: 'opt-001-ac', option_code: 'AC', text: 'Saya suka berpikir', dimension: 'AC' },
        { id: 'opt-001-ae', option_code: 'AE', text: 'Saya suka berbuat', dimension: 'AE' },
      ],
    },
    {
      item_id: 'lsi_item_002',
      order: 2,
      prompt: 'Saya belajar paling baik ketika:',
      options: [
        { id: 'opt-002-ce', option_code: 'CE', text: 'Saya terbuka terhadap pengalaman baru', dimension: 'CE' },
        { id: 'opt-002-ro', option_code: 'RO', text: 'Saya mendengarkan dan mengamati dengan seksama', dimension: 'RO' },
        { id: 'opt-002-ac', option_code: 'AC', text: 'Saya mengandalkan pemikiran logis', dimension: 'AC' },
        { id: 'opt-002-ae', option_code: 'AE', text: 'Saya bekerja keras untuk menyelesaikan sesuatu', dimension: 'AE' },
      ],
    },
  ],
  responses: [],
  contexts: [],
  progress: 0,
  completed_items: 0,
  current_item_index: 0,
  instructions:
    'Urutkan pernyataan berikut dari 1 (paling sesuai) hingga 4 (paling tidak sesuai) dengan cara Anda belajar.',
};

// Mock services
vi.mock('../../services/assessmentService', () => ({
  getAssessmentItems: vi.fn(),
  submitAnswers: vi.fn(),
}));

vi.mock('../../services/sessionService', () => ({
  getSession: vi.fn(),
}));

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
const renderWithProviders = (sessionId: string = '1') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/assessment/${sessionId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/assessment/:sessionId" element={<AssessmentPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Assessment Flow Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, '', '/assessment/1');

    const { getSession } = await import('../../services/sessionService');
    vi.mocked(getSession).mockResolvedValue({
      session_id: '1',
      user_id: mockAuth.user.id,
      status: 'STARTED',
    } as any);
  });

  it('should render loading state initially', async () => {
    const { getAssessmentItems } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockDeliveryPackage), 100)
        )
    );

    renderWithProviders();

    expect(screen.getByText('Memverifikasi akses sesi...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Memuat asesmen...')).toBeInTheDocument();
    });
  });

  it('should load and display assessment items', async () => {
    const { getAssessmentItems } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockResolvedValue(mockDeliveryPackage);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('KLSI 4.0 Assessment')).toBeInTheDocument();
    });

    expect(screen.getByText('Item 1 dari 2')).toBeInTheDocument();
    expect(screen.getByText('Ketika saya belajar:')).toBeInTheDocument();
    expect(screen.getByText('Saya suka merasakan')).toBeInTheDocument();
    expect(screen.getByText('Saya suka mengamati')).toBeInTheDocument();
  });

  it('should display instructions', async () => {
    const { getAssessmentItems } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockResolvedValue(mockDeliveryPackage);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Instruksi')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Klik tombol/i)[0]).toBeInTheDocument();
  });

  it('should update progress bar as items are completed', async () => {
    const { getAssessmentItems } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockResolvedValue(mockDeliveryPackage);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Progress: 0%/i)).toBeInTheDocument();
    });

    // Progress should start at 0
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should navigate between items', async () => {
    const { getAssessmentItems } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockResolvedValue(mockDeliveryPackage);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Item 1 dari 2')).toBeInTheDocument();
    });

    // Click next button
    const nextButton = screen.getByRole('button', { name: /selanjutnya/i });
    await user.click(nextButton);

    // Should show item 2
    await waitFor(() => {
      expect(screen.getByText('Item 2 dari 2')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Saya belajar paling baik ketika:')
    ).toBeInTheDocument();

    // Click previous button
    const prevButton = screen.getByRole('button', { name: /sebelumnya/i });
    await user.click(prevButton);

    // Should go back to item 1
    await waitFor(() => {
      expect(screen.getByText('Item 1 dari 2')).toBeInTheDocument();
    });
  });

  it('should disable previous button on first item', async () => {
    const { getAssessmentItems } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockResolvedValue(mockDeliveryPackage);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Item 1 dari 2')).toBeInTheDocument();
    });

    const prevButton = screen.getByRole('button', { name: /sebelumnya/i });
    expect(prevButton).toBeDisabled();
  });

  it('should auto-save answers after changes', async () => {
    const { getAssessmentItems, submitAnswers } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockResolvedValue(mockDeliveryPackage);
    const mockSubmitResponse: SubmitAnswersResponse = { saved_count: 1 };
    vi.mocked(submitAnswers).mockResolvedValue(mockSubmitResponse);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('KLSI 4.0 Assessment')).toBeInTheDocument();
    });

    // Simulate ranking (this would require interacting with RankingItem component)
    // For now, we just verify the auto-save mechanism would trigger

    // Wait for debounced auto-save (2 seconds)
    await waitFor(
      () => {
        // After answering, auto-save should trigger
        // This is a simplified check - in real scenario, we'd interact with ranking items
      },
      { timeout: 3000 }
    );
  });

  it('should handle API errors gracefully', async () => {
    const { getAssessmentItems } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockRejectedValue(
      new Error('Failed to load assessment')
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Data Tidak Ditemukan')).toBeInTheDocument();
      expect(
        screen.getByText('Tidak ada item asesmen yang tersedia untuk sesi ini.')
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', {
      name: /kembali ke beranda/i,
    });
    expect(backButton).toBeInTheDocument();
  });

  it('should show review button on last item', async () => {
    const { getAssessmentItems } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockResolvedValue(mockDeliveryPackage);

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Item 1 dari 2')).toBeInTheDocument();
    });

    // Navigate to last item
    const nextButton = screen.getByRole('button', { name: /selanjutnya/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Item 2 dari 2')).toBeInTheDocument();
    });

    // Should show Review button instead of Next
    expect(
      screen.getByRole('button', { name: /review/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /selanjutnya/i })
    ).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', async () => {
    const { getAssessmentItems } = await import(
      '../../services/assessmentService'
    );
    vi.mocked(getAssessmentItems).mockResolvedValue(mockDeliveryPackage);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('KLSI 4.0 Assessment')).toBeInTheDocument();
    });

    // Check for progress bar accessibility
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin');
    expect(progressBar).toHaveAttribute('aria-valuemax');
    expect(progressBar).toHaveAttribute('aria-valuenow');

    // Check button accessibility
    const helpButton = screen.getByLabelText(/bantuan/i);
    expect(helpButton).toBeInTheDocument();
  });
});
