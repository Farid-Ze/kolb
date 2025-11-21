/**
 * KLSI 4.0 - Assessment LFI Integration Test
 * Integration test untuk alur assessment dengan item LFI
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssessmentPage } from '../../pages/AssessmentPage';
import { AuthProvider } from '../../contexts/AuthContext';
import type { GetAssessmentItemsResponse } from '../../types/api';
import { useAssessmentStore } from '../../stores/assessmentStore';
import { getAssessmentItems } from '../../services/assessmentService';
import { getSession } from '../../services/sessionService';

// Mock data with LFI item
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
      type: 'Learning_Style',
      options: [
        { id: 'opt-001-ce', option_code: 'CE', text: 'Saya suka merasakan', dimension: 'CE' },
        { id: 'opt-001-ro', option_code: 'RO', text: 'Saya suka mengamati', dimension: 'RO' },
        { id: 'opt-001-ac', option_code: 'AC', text: 'Saya suka berpikir', dimension: 'AC' },
        { id: 'opt-001-ae', option_code: 'AE', text: 'Saya suka berbuat', dimension: 'AE' },
      ],
    },
    {
      item_id: 'lfi_item_001',
      order: 2,
      prompt: 'Ketika memulai sesuatu yang baru:',
      type: 'Learning_Flexibility',
      context: 'starting_something_new',
      category: 'starting_something_new',
      options: [
        { id: '101', option_code: 'CE', text: 'Saya mengandalkan perasaan', dimension: 'CE' },
        { id: '102', option_code: 'RO', text: 'Saya mengamati situasi', dimension: 'RO' },
        { id: '103', option_code: 'AC', text: 'Saya menganalisis masalah', dimension: 'AC' },
        { id: '104', option_code: 'AE', text: 'Saya langsung mencoba', dimension: 'AE' },
      ],
    },
  ],
  responses: [],
  contexts: [],
  progress: 0,
  completed_items: 0,
  current_item_index: 0,
  instructions: 'Instruksi...',
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

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockAuth,
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
const renderWithProviders = (sessionId: string = '1') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/assessment/${sessionId}`]}>
          <Routes>
            <Route path="/assessment/:sessionId" element={<AssessmentPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Assessment Flow with LFI Items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAssessmentStore.getState().reset();
    
    // Setup mocks
    vi.mocked(getAssessmentItems).mockResolvedValue(mockDeliveryPackage);
    
    vi.mocked(getSession).mockResolvedValue({
      id: '1',
      status: 'Started',
      user_id: 'user-1',
      instrument_id: 'KLSI-4.0',
      started_at: new Date().toISOString(),
      progress: 0,
    });
  });

  it('should render LFIContextCard for Learning_Flexibility items', async () => {
    renderWithProviders();

    // Wait for first item (Learning Style)
    await waitFor(() => {
      expect(screen.getByText('Saya suka merasakan')).toBeInTheDocument();
    });

    // Fill the first item to enable Next button
    // We click the rank buttons: 1, 2, 3, 4 for the 4 options respectively
    const buttons1 = screen.getAllByRole('button', { name: '1' });
    const buttons2 = screen.getAllByRole('button', { name: '2' });
    const buttons3 = screen.getAllByRole('button', { name: '3' });
    const buttons4 = screen.getAllByRole('button', { name: '4' });

    // Assuming the order of options matches the mock data:
    // 1. Saya suka merasakan
    // 2. Saya suka mengamati
    // 3. Saya suka berpikir
    // 4. Saya suka melakukan
    
    await userEvent.click(buttons1[0]); // Rank 1 for option 1
    await userEvent.click(buttons2[1]); // Rank 2 for option 2
    await userEvent.click(buttons3[2]); // Rank 3 for option 3
    await userEvent.click(buttons4[3]); // Rank 4 for option 4

    // Click Next
    const nextButton = screen.getByRole('button', { name: /Selanjutnya/i });
    await userEvent.click(nextButton);

    // Wait for LFI item
    await waitFor(() => {
      expect(screen.getByTestId('lfi-context-card')).toBeInTheDocument();
    });

    // Check if LFI specific UI elements are present
    expect(screen.getByTestId('lfi-context-card')).toBeInTheDocument();
    
    // Check options
    expect(screen.getByText('Saya mengandalkan perasaan')).toBeInTheDocument();
    expect(screen.getByText('Saya mengamati situasi')).toBeInTheDocument();
  });
});
