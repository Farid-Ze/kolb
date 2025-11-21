import { fetchJson } from '../core/api/client';
import type { ScorePreviewRequest, ScorePreviewResponse } from '../types/api';

/**
 * KLSI 4.0 - Score Service
 * Handles score preview and other score-related operations that don't require a session.
 */

export const getScorePreview = async (payload: ScorePreviewRequest): Promise<ScorePreviewResponse> => {
  return await fetchJson<ScorePreviewResponse>('/score/raw', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
