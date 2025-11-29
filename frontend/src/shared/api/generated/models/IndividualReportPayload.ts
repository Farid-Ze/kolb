/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportShareContext } from './ReportShareContext';
export type IndividualReportPayload = {
    sessionId: string;
    generatedAt?: string | null;
    kind?: string;
    raw: Record<string, any>;
    percentiles: Record<string, any>;
    style: Record<string, any>;
    lfi: Record<string, any>;
    analytics: Record<string, any>;
    visualization?: any | null;
    sessionDesigns?: any[] | null;
    learningSpace?: any | null;
    enhancedAnalytics?: any | null;
    notes?: any | null;
    owner?: any | null;
    shareContext?: (ReportShareContext | null);
    responsibleUseNotice?: string | null;
};

