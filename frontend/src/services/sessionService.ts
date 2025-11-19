/**
 * KLSI 4.0 - SessionService
 * Task 22: SessionService untuk startSession dan getSession
 * 
 * Service layer untuk manajemen sesi asesmen
 * Menggunakan authenticatedApiCall untuk automatic token injection
 */

import { getApiUrl } from '../config/api';
import { authenticatedApiCall } from '../utils/apiHelper';
import type { StartSessionResponse, Session, SessionValidationSnapshot } from '../types/api';

/**
 * Task 22: Start new assessment session
 * POST /engine/sessions/start
 */
export const startSession = async (
  instrumentCode: string = 'S-KLSI-4'
): Promise<StartSessionResponse> => {
  return authenticatedApiCall<StartSessionResponse>(
    getApiUrl('/engine/sessions/start'),
    {
      method: 'POST',
      body: JSON.stringify({ instrument_code: instrumentCode }),
    }
  );
};

/**
 * Task 24: Get session details
 * GET /engine/sessions/:id
 */
export const getSession = async (sessionId: string): Promise<Session> => {
  return authenticatedApiCall<Session>(
    getApiUrl(`/engine/sessions/${sessionId}`),
    {
      method: 'GET',
    }
  );
};

/**
 * Task 21: Get all sessions (with optional filters)
 * GET /engine/sessions/
 */
export const getSessions = async (params?: {
  status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  skip?: number;
  limit?: number;
}): Promise<Session[]> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.skip) queryParams.append('skip', params.skip.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = queryParams.toString()
    ? `${getApiUrl('/engine/sessions/')}?${queryParams}`
    : getApiUrl('/engine/sessions/');

  return authenticatedApiCall<Session[]>(url, {
    method: 'GET',
  });
};

/**
 * Task 33: Finalize assessment session
 * POST /engine/sessions/:id/finalize
 */
export const finalizeSession = async (
  sessionId: string
): Promise<{ session_id: string; status: string; completed_at: string; message: string }> => {
  return authenticatedApiCall(
    getApiUrl(`/engine/sessions/${sessionId}/finalize`),
    {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    }
  );
};

/**
 * Get validation snapshot (items + contexts) for a session
 * GET /engine/sessions/:id/validation
 */
export const getSessionValidation = async (
  sessionId: string
): Promise<SessionValidationSnapshot> => {
  return authenticatedApiCall<SessionValidationSnapshot>(
    getApiUrl(`/engine/sessions/${sessionId}/validation`),
    {
      method: 'GET',
    }
  );
};
