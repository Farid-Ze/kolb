import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScorePreviewPage } from '../../pages/ScorePreviewPage';
import { getScorePreview } from '../../services/scoreService';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../../services/scoreService');
vi.mock('../../hooks/useNonBlockingNavigate', () => ({
  useNonBlockingNavigate: () => vi.fn(),
}));
vi.mock('../../components/report/ScoreDisplay', () => ({
  ScoreDisplay: () => <div data-testid="score-display">Score Display</div>,
}));
vi.mock('../../components/report/LearningStyleChart', () => ({
  LearningStyleChart: () => <div data-testid="learning-style-chart">Learning Style Chart</div>,
}));
vi.mock('../../components/report/KiteChart', () => ({
  KiteChart: () => <div data-testid="kite-chart">Kite Chart</div>,
}));
vi.mock('../../components/report/FlexibilityChart', () => ({
  FlexibilityChart: () => <div data-testid="flexibility-chart">Flexibility Chart</div>,
}));
vi.mock('../../components/report/EnhancedAnalyticsPanel', () => ({
  EnhancedAnalyticsPanel: () => <div data-testid="enhanced-analytics">Enhanced Analytics</div>,
}));

describe('ScorePreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the input form initially', () => {
    render(
      <MemoryRouter>
        <ScorePreviewPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Score Preview Tool')).toBeInTheDocument();
    expect(screen.getByLabelText(/CE \(Concrete Experience\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/RO \(Reflective Observation\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/AC \(Abstract Conceptualization\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/AE \(Active Experimentation\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hitung Profil/i })).toBeInTheDocument();
  });

  it('calls getScorePreview and displays results on form submission', async () => {
    const mockResponse = {
      raw: { CE: 30, RO: 30, AC: 30, AE: 30 },
      percentiles: {},
      visualization: { kite: {} },
      style: {},
    };
    (getScorePreview as any).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <ScorePreviewPage />
      </MemoryRouter>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/CE/), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/RO/), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/AC/), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/AE/), { target: { value: '30' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Hitung Profil/i }));

    await waitFor(() => {
      expect(getScorePreview).toHaveBeenCalledWith({
        raw: { CE_raw: 30, RO_raw: 30, AC_raw: 30, AE_raw: 30 },
        contexts: [],
      });
    });

    // Check if result components are rendered
    expect(screen.getByTestId('score-display')).toBeInTheDocument();
    expect(screen.getByTestId('learning-style-chart')).toBeInTheDocument();
    expect(screen.getByTestId('kite-chart')).toBeInTheDocument();
  });

  it('displays error message on API failure', async () => {
    (getScorePreview as any).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <ScorePreviewPage />
      </MemoryRouter>
    );

    // Fill in valid inputs to pass browser validation (min=12)
    fireEvent.change(screen.getByLabelText('CE (Concrete Experience)'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('RO (Reflective Observation)'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('AC (Abstract Conceptualization)'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('AE (Active Experimentation)'), { target: { value: '20' } });

    fireEvent.click(screen.getByRole('button', { name: /Hitung Profil/i }));

    await waitFor(() => {
      expect(getScorePreview).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Gagal menghitung skor. Pastikan input valid.')).toBeInTheDocument();
    });
  });
});
