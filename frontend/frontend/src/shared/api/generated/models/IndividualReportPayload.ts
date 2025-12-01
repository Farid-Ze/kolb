/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnalyticsData } from './AnalyticsData';
import type { LearningSpaceData } from './LearningSpaceData';
import type { ReportShareContext } from './ReportShareContext';
import type { VisualizationConfig } from './VisualizationConfig';
export type IndividualReportPayload = {
    sessionId: string;
    generatedAt?: string | null;
    kind?: string;
    raw: Record<string, any>;
    percentiles: Record<string, any>;
    style: Record<string, any>;
    lfi: Record<string, any>;
    analytics: AnalyticsData;
    visualization?: (VisualizationConfig | null);
    sessionDesigns?: any[] | null;
    learningSpace?: (LearningSpaceData | null);
    enhancedAnalytics?: any | null;
    notes?: any | null;
    owner?: any | null;
    shareContext?: (ReportShareContext | null);
    responsibleUseNotice?: string | null;
};

