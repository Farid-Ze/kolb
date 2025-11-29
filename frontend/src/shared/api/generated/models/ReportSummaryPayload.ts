/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportDialecticSummary } from './ReportDialecticSummary';
import type { ReportFlexibilitySummary } from './ReportFlexibilitySummary';
import type { ReportLongitudinalSummary } from './ReportLongitudinalSummary';
import type { ReportStyleSummary } from './ReportStyleSummary';
export type ReportSummaryPayload = {
    sessionId: string;
    generatedAt?: string | null;
    learningStyle?: (ReportStyleSummary | null);
    nineStyle?: (ReportStyleSummary | null);
    flexibility?: (ReportFlexibilitySummary | null);
    dialectic?: (ReportDialecticSummary | null);
    longitudinal?: (ReportLongitudinalSummary | null);
};

