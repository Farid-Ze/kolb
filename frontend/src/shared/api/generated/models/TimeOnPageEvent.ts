/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Captures duration spent on a specific route.
 */
export type TimeOnPageEvent = {
    pagePath: string;
    /**
     * Duration in ms (max 1 hour)
     */
    durationMs: number;
    sessionId?: (number | null);
};

