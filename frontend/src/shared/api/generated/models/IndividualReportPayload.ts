/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportShareContext } from './ReportShareContext';
export type IndividualReportPayload = {
    sessionId: string;
    generatedAt?: string | null;
    kind?: IndividualReportPayload.kind;
    raw: Record<string, any>;
    percentiles?: any | null;
    style?: any | null;
    lfi?: any | null;
    analytics?: any | null;
    visualization?: any | null;
    sessionDesigns?: any[] | null;
    learningSpace?: any | null;
    enhancedAnalytics?: any | null;
    notes?: any | null;
    owner?: any | null;
    shareContext?: (ReportShareContext | null);
    responsibleUseNotice?: string | null;
};
export namespace IndividualReportPayload {
    export enum kind {
        INDIVIDUAL = 'individual',
    }
}

