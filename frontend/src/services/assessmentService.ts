/**
 * KLSI 4.0 - AssessmentService
 * Task 25, 29, 33: Assessment API calls dengan authenticatedApiCall
 * 
 * Service layer untuk assessment delivery dan submission
 * Menggunakan authenticatedApiCall untuk automatic token injection
 */

import { getApiUrl } from '../config/api';
import { authenticatedApiCall } from '../utils/apiHelper';
import type {
  GetAssessmentItemsResponse,
  SubmitAnswersRequest,
  SubmitAnswersResponse,
} from '../types/api';

/**
 * Task 25: Get assessment items untuk session
 * GET /engine/sessions/:id/items
 */
export const getAssessmentItems = async (
  sessionId: string
): Promise<GetAssessmentItemsResponse> => {
  return authenticatedApiCall<GetAssessmentItemsResponse>(
    getApiUrl(`/engine/sessions/${sessionId}/items`),
    {
      method: 'GET',
    }
  );
};

/**
 * Task 29: Submit answers (autosave)
 * POST /engine/sessions/:id/items
 */
export const submitAnswers = async (
  sessionId: string,
  payload: SubmitAnswersRequest
): Promise<SubmitAnswersResponse> => {
  return authenticatedApiCall<SubmitAnswersResponse>(
    getApiUrl(`/engine/sessions/${sessionId}/items`),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
};

/**
 * Task 33: Finalize session
 * POST /engine/sessions/:id/finalize
 */
export const finalizeSession = async (
  sessionId: string
): Promise<{ success: boolean; message: string }> => {
  return authenticatedApiCall<{ success: boolean; message: string }>(
    getApiUrl(`/engine/sessions/${sessionId}/finalize`),
    {
      method: 'POST',
    }
  );
};
