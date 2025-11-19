/**
 * KLSI 4.0 - Assessment Review Page Integration Test
 * Memastikan halaman review menangani kasus kosong dan error sesuai TODO5.
 */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AssessmentReviewPage } from '../../pages/AssessmentReviewPage';
import { AuthProvider } from '../../contexts/AuthContext';
import type { GetAssessmentItemsResponse, SessionValidationSnapshot } from '../../types/api';

const baseAssessmentResponse: GetAssessmentItemsResponse = {
  session_id: '99',
  instrument_code: 'KLSI',
  instrument_version: '4.0',
  status: 'Started',
  total_items: 0,
  items: [],
  responses: [],
  contexts: [],
  progress: 0,
  completed_items: 0,
  current_item_index: 0,
  instructions: undefined,
};

const baseValidationSnapshot: SessionValidationSnapshot = {
  ready: false,
  issues: [],
  diagnostics: {
    items: {
      session_exists: true,
      status: 'STARTED',
      total_items: 0,
      responded_items: 0,
      missing_item_ids: [],
      items_with_rank_conflict: [],
      items_with_missing_ranks: [],
      duplicate_choice_ids: [],
      ready_to_complete: false,
    },
    context_count: 0,
    contexts: {
      expected_total: 8,
      submitted_total: 0,
      submitted_names: [],
      status: [],
      missing_names: [],
      unknown_names: [],
      duplicate_names: [],
    },
  },
};

vi.mock('../../services/assessmentService', () => ({
  getAssessmentItems: vi.fn(),
  submitAnswers: vi.fn(),
}));

vi.mock('../../services/sessionService', () => ({
  getSessionValidation: vi.fn(),
  finalizeSession: vi.fn().mockResolvedValue({ session_id: '99', ok: true, result: null }),
  getSession: vi.fn(),
}));

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

const renderReviewPage = async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/assessment/99/review`]}> 
        <AuthProvider>
          <Routes>
            <Route path="/assessment/:sessionId/review" element={<AssessmentReviewPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('AssessmentReviewPage edge cases', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/assessment/99/review');

    const { getSession } = await import('../../services/sessionService');
    vi.mocked(getSession).mockResolvedValue({
      session_id: '99',
      user_id: mockAuth.user.id,
      status: 'STARTED',
    } as any);
  });

  it('renders empty state when no assessment items are available', async () => {
    const { getAssessmentItems } = await import('../../services/assessmentService');
    const { getSessionValidation } = await import('../../services/sessionService');

    vi.mocked(getAssessmentItems).mockResolvedValue(baseAssessmentResponse);
    vi.mocked(getSessionValidation).mockResolvedValue(baseValidationSnapshot);

    await renderReviewPage();

    await waitFor(() => {
      expect(screen.getByText('Data Review Belum Tersedia')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Sesi ini belum memiliki item asesmen yang lengkap/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kembali ke Asesmen/i })).toBeInTheDocument();
  });

  it('renders error state when assessment items request fails', async () => {
    const { getAssessmentItems } = await import('../../services/assessmentService');
    const { getSessionValidation } = await import('../../services/sessionService');

    vi.mocked(getAssessmentItems).mockRejectedValue(new Error('Timeout saat menghubungi server'));
    vi.mocked(getSessionValidation).mockResolvedValue(baseValidationSnapshot);

    await renderReviewPage();

    await waitFor(() => {
      expect(screen.getByText('Gagal Memuat Data Review')).toBeInTheDocument();
    });
    expect(screen.getByText(/Timeout saat menghubungi server/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Coba Lagi/i })).toBeInTheDocument();
  });
});
