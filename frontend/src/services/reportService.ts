/**
 * KLSI 4.0 - ReportService
 * Task 37: getReport API dengan authenticatedApiCall
 * 
 * Service layer untuk fetching report data
 * Menggunakan authenticatedApiCall untuk automatic token injection
 */

import { getApiUrl } from '../config/api';
import { authenticatedApiCall } from '../utils/apiHelper';
import type {
  CreateReportShareRequest,
  CreateReportShareResponse,
  Report,
} from '../types/api';

/**
 * Task 37: Get report for a session (backend: GET /reports/{session_id})
 */
export const getReport = async (sessionId: string | number): Promise<Report> => {
  return authenticatedApiCall<Report>(
    getApiUrl(`/reports/${sessionId}`),
    {
      method: 'GET',
    }
  );
};

/**
 * Alias for report detail (kept for backward compatibility with shared-link routes)
 */
export const getReportById = async (reportId: string | number): Promise<Report> => {
  return getReport(reportId);
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

export const createReportShare = async (
  sessionId: string | number,
  payload: CreateReportShareRequest
): Promise<CreateReportShareResponse> => {
  return authenticatedApiCall<CreateReportShareResponse>(
    getApiUrl(`/reports/${sessionId}/share`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
};

export const getSharedReport = async (token: string): Promise<Report> => {
  return authenticatedApiCall<Report>(
    getApiUrl(`/reports/shared/${token}`),
    {
      method: 'GET',
    }
  );
};
