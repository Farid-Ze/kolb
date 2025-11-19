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
  type GuideOpenEvent,
  type PageViewEvent,
  type ActionEvent,
} from '../services/telemetryService';
import { useAuth } from '../contexts/AuthContext';
import { useUIPreferencesOptional } from '../contexts/UIPreferencesContext';

const normalizeLanguage = (locale?: string | null) => {
  if (!locale) return 'id';
  const [primary] = locale.split('-');
  return primary?.toLowerCase() || locale.toLowerCase();
};

const sanitizeMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata) return undefined;
  return Object.entries(metadata).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }
    acc[key] = typeof value === 'string' ? value : String(value);
    return acc;
  }, {});
};

/**
 * Hook untuk tracking telemetry events
 */
export const useTelemetry = () => {
  const { user } = useAuth();
  const preferences = useUIPreferencesOptional();
  const telemetryEnabled = preferences?.telemetryEnabled ?? false;
  const consentFlag = telemetryEnabled;
  const actorRole: ActionEvent['actor_role'] = (user?.role as ActionEvent['actor_role']) ?? 'ANON';

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
    mutationFn: (data: PageViewEvent) => trackPageView(data),
    onError: (error: Error) => {
      console.warn('Telemetry tracking failed:', error);
    },
  });

  // Track action
  const actionMutation = useMutation({
    mutationFn: (data: ActionEvent) => trackAction(data),
    onError: (error: Error) => {
      console.warn('Telemetry tracking failed:', error);
    },
  });

  return {
    telemetryEnabled,

    trackGuideOpen: (
      guideId: string,
      locale: string,
      context?: string,
      options?: { surface?: GuideOpenEvent['surface']; metadata?: Record<string, unknown> }
    ) => {
      if (!consentFlag) return;
      guideOpenMutation.mutate({
        guide_id: guideId,
        language: normalizeLanguage(locale),
        surface: options?.surface ?? 'modal',
        context,
        metadata: sanitizeMetadata({ ...options?.metadata, locale }),
        consent: true,
      });
    },

    trackPageView: (
      pagePath: string,
      pageTitle: string,
      referrer?: string,
      localeOverride?: string,
    ) => {
      if (!consentFlag) return;
      const fallbackLocale =
        localeOverride || (typeof navigator !== 'undefined' ? navigator.language : 'id-ID');
      pageViewMutation.mutate({
        page_path: pagePath,
        page_title: pageTitle,
        referrer: referrer ?? (typeof document !== 'undefined' ? document.referrer : undefined),
        locale: normalizeLanguage(fallbackLocale),
        consent: true,
      });
    },

    trackAction: (
      actionType: string,
      actionTarget: string,
      actionValue?: string,
      metadata?: Record<string, unknown>
    ) => {
      if (!consentFlag) return;
      actionMutation.mutate({
        action_type: actionType,
        action_target: actionTarget,
        action_value: actionValue,
        metadata: sanitizeMetadata(metadata),
        consent: true,
        actor_role: actorRole,
      });
    },

    // Loading states
    isTracking: 
      guideOpenMutation.isPending || 
      pageViewMutation.isPending || 
      actionMutation.isPending,
  };
};
