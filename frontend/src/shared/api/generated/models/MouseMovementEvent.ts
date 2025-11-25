/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Captures mouse coordinates. Should be throttled/sampled on client.
 */
export type MouseMovementEvent = {
    sessionId?: (number | null);
    pagePath: string;
    'x': number;
    'y': number;
    viewportWidth: number;
    viewportHeight: number;
    timestampMs: number;
};

