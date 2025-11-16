/**
 * KLSI 4.0 - TelemetryService
 * Task Phase 7: Telemetry untuk tracking user interactions
 * 
 * Service layer untuk telemetry dan analytics
 * Menggunakan authenticatedApiCall untuk automatic token injection
 */

import { getApiUrl } from '../config/api';
import { authenticatedApiCall } from '../utils/apiHelper';

export interface GuideOpenEvent {
  guide_id: string;
  locale: string;
  context?: string;
  timestamp?: string;
}

/**
 * Track guide open event
 * POST /telemetry/guide-open
 */
export const trackGuideOpen = async (
  event: GuideOpenEvent
): Promise<{ ok: boolean }> => {
  return authenticatedApiCall<{ ok: boolean }>(
    getApiUrl('/telemetry/guide-open'),
    {
      method: 'POST',
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      }),
    }
  );
};

/**
 * Track page view
 * POST /telemetry/page-view
 */
export const trackPageView = async (data: {
  page_path: string;
  page_title: string;
  referrer?: string;
}): Promise<{ ok: boolean }> => {
  return authenticatedApiCall<{ ok: boolean }>(
    getApiUrl('/telemetry/page-view'),
    {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }),
    }
  );
};

/**
 * Track user action
 * POST /telemetry/action
 */
export const trackAction = async (data: {
  action_type: string;
  action_target: string;
  action_value?: string;
  metadata?: Record<string, any>;
}): Promise<{ ok: boolean }> => {
  return authenticatedApiCall<{ ok: boolean }>(
    getApiUrl('/telemetry/action'),
    {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }),
    }
  );
};
