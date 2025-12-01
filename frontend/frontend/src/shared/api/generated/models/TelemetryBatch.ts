/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TelemetryEvent } from './TelemetryEvent';
/**
 * Batch of telemetry events for efficient processing.
 */
export type TelemetryBatch = {
    /**
     * Optional session ID for correlation
     */
    sessionId?: string | null;
    /**
     * Events to process
     */
    events: Array<TelemetryEvent>;
};

