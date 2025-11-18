/**
 * KLSI 4.0 - ReportService
 * Task 37: getReport API dengan authenticatedApiCall
 * 
 * Service layer untuk fetching report data
 * Menggunakan authenticatedApiCall untuk automatic token injection
 */

import { getApiUrl } from '../config/api';
import { authenticatedApiCall } from '../utils/apiHelper';
import type { Report } from '../types/api';

// Re-export types from api.d.ts
export type { 
  Report, 
  RawScores, 
  DialecticScores, 
  LearningStyle, 
  NineStyle,
  FlexibilityIndex, 
  NormGroup,
  PercentileScores 
} from '../types/api';

/**
 * Task 37: Get report for a session
 * GET /reports/sessions/:id
 */
export const getReport = async (sessionId: string): Promise<Report> => {
  return authenticatedApiCall<Report>(
    getApiUrl(`/reports/sessions/${sessionId}`),
    {
      method: 'GET',
    }
  );
};

/**
 * Backwards-compatible alias for legacy tests expecting getReportById
 */
export const getReportById = async (sessionId: string): Promise<Report> => {
  return getReport(sessionId);
};

/**
 * Get all reports for current user
 * GET /reports/self
 */
export const getSelfReports = async (): Promise<Report[]> => {
  return authenticatedApiCall<Report[]>(
    getApiUrl('/reports/self'),
    {
      method: 'GET',
    }
  );
};
