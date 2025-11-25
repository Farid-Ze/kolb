/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Payload capturing latency + blur telemetry for a forced-choice item.
 */
export type AssessmentTelemetryPayload = {
    /**
     * Assessment session identifier
     */
    sessionId: number;
    /**
     * Assessment item identifier
     */
    itemId: number;
    /**
     * Rank assigned to the selected option
     */
    responseRank: number;
    /**
     * Time spent on the item in milliseconds
     */
    responseLatencyMs: number;
    /**
     * Number of blur events recorded for the item
     */
    blurEvents?: (number | null);
    /**
     * Optional telemetry metadata blob (e.g., device info)
     */
    meta?: (Record<string, any> | null);
};

