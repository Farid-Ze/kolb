/**
 * Accessibility regression tests for keyboard focus order and NonDiagnosticNotice sequencing
 * across critical analytic surfaces (Assessment, Report, Team Detail, Research Detail).
 */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AssessmentStartPage } from '../../pages/AssessmentStartPage';
import { ReportPage } from '../../pages/ReportPage';
import { TeamDetailPage } from '../../pages/TeamDetailPage';
import { ResearchDetailPage } from '../../pages/ResearchDetailPage';
import { getSampleReport } from '../fixtures/reportSample';
import type { StudyData, StudyDetail } from '../../services/researchService';
import type { TeamDetail, TeamRollup } from '../../services/teamService';
import type { Session } from '../../types/api';
import { UIPreferencesProvider } from '../../contexts/UIPreferencesContext';

const mockTrackPageView = vi.fn();
vi.mock('../../hooks/useTelemetry', () => ({
  useTelemetry: () => ({ trackPageView: mockTrackPageView }),
}));

const mockAuth = {
  user: {
    id: 'mediator-1',
    email: 'mediator@example.com',
    name: 'Mediator User',
    role: 'MEDIATOR',
    created_at: '2024-01-01T00:00:00Z',
  },
  accessToken: 'token',
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

vi.mock('../../hooks/useSessionGuard', () => ({
  useSessionGuard: () => ({ isChecking: false, hasAccess: true }),
}));

vi.mock('../../services/reportService', () => ({
  getReport: vi.fn(),
  getReportById: vi.fn(),
  getSharedReport: vi.fn(),
  createReportShare: vi.fn(),
}));

vi.mock('../../services/sessionService', () => ({
  getSession: vi.fn(),
}));

vi.mock('../../services/assessmentService', () => ({
  getAssessmentItems: vi.fn(),
}));

vi.mock('../../services/teamService', () => ({
  getTeamDetails: vi.fn(),
  getTeamRollup: vi.fn(),
  addMemberToTeam: vi.fn(),
  removeMemberFromTeam: vi.fn(),
}));

vi.mock('../../services/researchService', () => ({
  getStudyDetails: vi.fn(),
  getStudyData: vi.fn(),
  exportStudyDataToCSV: vi.fn(),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderRoute = (
  initialEntry: string,
  path: string,
  element: React.ReactElement,
  options: { withUIPreferences?: boolean } = {},
) => {
  const routeTree = (
    <Routes>
      <Route path={path} element={element} />
    </Routes>
  );

  const wrappedTree = options.withUIPreferences ? (
    <UIPreferencesProvider>{routeTree}</UIPreferencesProvider>
  ) : (
    routeTree
  );

  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        {wrappedTree}
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Keyboard focus order and NonDiagnosticNotice sequencing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps AssessmentStartPage focus order predictable and notice leading content', async () => {
    const sessionResponse: Session = {
      id: 'session-1',
      user_id: 'student-1',
      instrument_id: 'instrument-1',
      status: 'In Progress',
      started_at: '2024-01-01T00:00:00Z',
      completed_at: undefined,
      progress: 0,
      current_item_index: 0,
      metadata: {},
    };
    const { getSession } = await import('../../services/sessionService');
    vi.mocked(getSession).mockResolvedValue(sessionResponse);

    const { getAssessmentItems } = await import('../../services/assessmentService');
    vi.mocked(getAssessmentItems).mockResolvedValue({
      session_id: 'session-1',
      instrument_code: 'S-KLSI-4',
      total_items: 12,
      items: [],
      responses: [],
      contexts: [],
      progress: 0,
    });

    const user = userEvent.setup();
    renderRoute('/assessment/start/session-1', '/assessment/start/:sessionId', <AssessmentStartPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mulai asesmen/i })).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /kembali ke beranda/i });
    const startButton = screen.getByRole('button', { name: /mulai asesmen/i });

    await user.tab();
    expect(backButton).toHaveFocus();
    await user.tab();
    expect(startButton).toHaveFocus();

    const [notice] = screen.getAllByRole('note');
    const infoHeading = screen.getByRole('heading', { name: /apa yang akan anda lakukan/i });
    const orderFlag = notice.compareDocumentPosition(infoHeading);
    expect(orderFlag & Node.DOCUMENT_POSITION_FOLLOWING).toBeGreaterThan(0);
  });

  it('links ReportPage analytics to NonDiagnosticNotice and preserves focus order', async () => {
    const sampleReport = getSampleReport();
    const { getReportById, getReport } = await import('../../services/reportService');
    vi.mocked(getReportById).mockResolvedValue(sampleReport);
    vi.mocked(getReport).mockResolvedValue(sampleReport);

    const user = userEvent.setup();
    renderRoute('/report/abc123', '/report/:reportId', <ReportPage />, { withUIPreferences: true });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /laporan hasil asesmen/i })).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /kembali ke beranda/i });
    const printButton = screen.getByRole('button', { name: /cetak/i });
    const pdfButton = screen.getByRole('button', { name: /pdf/i });

    await user.tab();
    expect(backButton).toHaveFocus();
    await user.tab();
    if (document.activeElement !== printButton) {
      expect(document.activeElement).toBe(pdfButton);
      await user.tab();
    }
    expect(printButton).toHaveFocus();

    const [notice] = screen.getAllByRole('note');
    const noticeId = notice.getAttribute('id');
    expect(noticeId).toBeTruthy();

    const learningBlock = screen.getByTestId('learning-style-analytics');
    const lfiBlock = screen.getByTestId('flexibility-analytics');

    expect(learningBlock).toHaveAttribute('aria-describedby', noticeId!);
    expect(lfiBlock).toHaveAttribute('aria-describedby', noticeId!);

    const orderFlag = notice.compareDocumentPosition(learningBlock);
    expect(orderFlag & Node.DOCUMENT_POSITION_FOLLOWING).toBeGreaterThan(0);
  });

  it('ensures TeamDetailPage glass analytics reference the notice for screen readers', async () => {
    const teamDetail: TeamDetail = {
      id: 1,
      name: 'Team Alpha',
      description: 'Contoh tim',
      created_by: 'mediator-1',
      created_at: '2024-01-01T00:00:00Z',
      member_count: 2,
      members: [
        { user_id: 1, name: 'John Doe', email: 'john@example.com', joined_at: '2024-01-01T00:00:00Z' },
        { user_id: 2, name: 'Jane Doe', email: 'jane@example.com', joined_at: '2024-01-02T00:00:00Z' },
      ],
    };

    const teamRollup: TeamRollup = {
      team_id: 1,
      team_name: 'Team Alpha',
      member_count: 2,
      data_points: [
        { user_id: 1, name: 'John Doe', email: 'john@example.com', ac_ce: 10, ae_ro: -5, learning_style: 'Assimilator', style_code: 'ASM' },
        { user_id: 2, name: 'Jane Doe', email: 'jane@example.com', ac_ce: -12, ae_ro: 8, learning_style: 'Diverger', style_code: 'DIV' },
      ],
      members: [],
      legacy_members: [],
      summary: {
        total_members: 2,
        members_with_data: 2,
        avg_ac_ce: -1,
        avg_ae_ro: 1,
        style_distribution: { Assimilator: 1, Diverger: 1 },
      },
      diversity_score: 0.8,
      balance_metrics: {
        CE_percentage: 50,
        RO_percentage: 50,
        AC_percentage: 50,
        AE_percentage: 50,
      },
    };

    const { getTeamDetails, getTeamRollup } = await import('../../services/teamService');
    vi.mocked(getTeamDetails).mockResolvedValue(teamDetail);
    vi.mocked(getTeamRollup).mockResolvedValue(teamRollup);

    const user = userEvent.setup();
    renderRoute('/teams/1', '/teams/:teamId', <TeamDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /kembali ke daftar tim/i });
    const addButton = screen.getByRole('button', { name: /tambah anggota/i });

    await user.tab();
    expect(backButton).toHaveFocus();
    await user.tab();
    expect(addButton).toHaveFocus();

    const notice = screen.getByRole('note', { name: /catatan penggunaan bertanggung jawab/i });
    const noticeId = notice.getAttribute('id');
    expect(noticeId).toBeTruthy();

    const chart = screen.getByTestId('team-rollup-analytics');
    expect(chart).toHaveAttribute('aria-describedby', noticeId!);

    const statsBlock = screen.getByTestId('team-stats-block');
    expect(statsBlock).toHaveAttribute('aria-describedby', noticeId!);
  });

  it('keeps ResearchDetailPage analytics tied to the responsible-use notice', async () => {
    const studyDetail: StudyDetail = {
      id: 42,
      title: 'Pilot Study',
      description: 'Contoh penelitian',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      participant_count: 5,
      status: 'ACTIVE',
      notes: null,
      participants: [],
    };

    const studyData: StudyData = {
      study_id: 42,
      study_title: 'Pilot Study',
      filters_applied: {},
      data_points: [
        {
          session_id: 1,
          user_id: 1,
          user_email: 'john@example.com',
          user_name: 'John Doe',
          generated_at: '2024-01-02T00:00:00Z',
          ce_score: 30,
          ro_score: 28,
          ac_score: 34,
          ae_score: 26,
          ac_ce: 4,
          ae_ro: -2,
          learning_style: 'Assimilator',
          style_code: 'ASM',
          norm_group: 'EDU:University Degree',
          assessment_duration_seconds: 900,
        },
      ],
      summary: {
        total_sessions: 1,
        unique_participants: 1,
        date_range: {
          earliest: '2024-01-02T00:00:00Z',
          latest: '2024-01-02T00:00:00Z',
        },
        style_distribution: { Assimilator: 1 },
      },
    };

    const { getStudyDetails, getStudyData } = await import('../../services/researchService');
    vi.mocked(getStudyDetails).mockResolvedValue(studyDetail);
    vi.mocked(getStudyData).mockResolvedValue(studyData);

    const user = userEvent.setup();
    renderRoute('/research/42', '/research/:studyId', <ResearchDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Pilot Study').length).toBeGreaterThan(0);
    });

    const backButton = screen.getByRole('button', { name: /daftar studi/i });
    const filterButton = screen.getByRole('button', { name: /filter/i });

    await user.tab();
    expect(backButton).toHaveFocus();
    await user.tab();
    expect(filterButton).toHaveFocus();

    const notice = screen.getByRole('note', { name: /catatan penggunaan bertanggung jawab/i });
    const noticeId = notice.getAttribute('id');
    expect(noticeId).toBeTruthy();

    const statsBlock = screen.getByTestId('study-stats-block');
    const dataPreview = screen.getByTestId('study-data-preview');

    expect(statsBlock).toHaveAttribute('aria-describedby', noticeId!);
    expect(dataPreview).toHaveAttribute('aria-describedby', noticeId!);

    const orderFlag = notice.compareDocumentPosition(statsBlock);
    expect(orderFlag & Node.DOCUMENT_POSITION_FOLLOWING).toBeGreaterThan(0);
  });
});
