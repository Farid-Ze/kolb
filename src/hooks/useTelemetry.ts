/**
 * KLSI 4.0 - useTelemetry Hook
 * Task Phase 7: Hook untuk telemetry tracking
 * 
 * Custom hook untuk tracking user interactions dengan React Query
 */

import { useMutation } from '@tanstack/react-query';
import { 
  trackGuideOpen, 
  trackPageView, 
  trackAction,
  type GuideOpenEvent 
} from '../services/telemetryService';

/**
 * Hook untuk tracking telemetry events
 */
export const useTelemetry = () => {
  // Track guide open
  const guideOpenMutation = useMutation({
    mutationFn: (event: GuideOpenEvent) => trackGuideOpen(event),
    onError: (error: Error) => {
      // Silent fail - telemetry should not block user flow
      console.warn('Telemetry tracking failed:', error);
    },
  });

  // Track page view
  const pageViewMutation = useMutation({
    mutationFn: (data: {
      page_path: string;
      page_title: string;
      referrer?: string;
    }) => trackPageView(data),
    onError: (error: Error) => {
      console.warn('Telemetry tracking failed:', error);
    },
  });

  // Track action
  const actionMutation = useMutation({
    mutationFn: (data: {
      action_type: string;
      action_target: string;
      action_value?: string;
      metadata?: Record<string, any>;
    }) => trackAction(data),
    onError: (error: Error) => {
      console.warn('Telemetry tracking failed:', error);
    },
  });

  return {
    // Track guide open
    trackGuideOpen: (guideId: string, locale: string, context?: string) => {
      guideOpenMutation.mutate({ guide_id: guideId, locale, context });
    },

    // Track page view
    trackPageView: (pagePath: string, pageTitle: string, referrer?: string) => {
      pageViewMutation.mutate({ page_path: pagePath, page_title: pageTitle, referrer });
    },

    // Track action
    trackAction: (
      actionType: string,
      actionTarget: string,
      actionValue?: string,
      metadata?: Record<string, any>
    ) => {
      actionMutation.mutate({ 
        action_type: actionType, 
        action_target: actionTarget, 
        action_value: actionValue,
        metadata 
      });
    },

    // Loading states
    isTracking: 
      guideOpenMutation.isPending || 
      pageViewMutation.isPending || 
      actionMutation.isPending,
  };
};
