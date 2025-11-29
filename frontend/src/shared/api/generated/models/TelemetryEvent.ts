/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single telemetry event.
 */
export type TelemetryEvent = {
    /**
     * Event type: mouse, scroll, time_on_page, etc.
     */
    type: string;
    /**
     * Client-side timestamp in milliseconds
     */
    timestampMs: number;
    /**
     * Event-specific data
     */
    payload?: Record<string, any>;
};

