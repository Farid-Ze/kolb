/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AssessmentResultsResponse = {
    sessionId: number;
    finalizedAt?: (string | null);
    kiteCoordinates?: (Record<string, number> | null);
    blindspots?: Array<string>;
    strengths?: Array<string>;
    lfiScore?: (number | null);
    percentiles?: (Record<string, any> | null);
    cyclePhase?: (string | null);
    backupStyle?: (string | null);
};

