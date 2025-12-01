/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { KiteCoordinates } from './KiteCoordinates';
export type AssessmentResultsResponse = {
    sessionId: string;
    finalizedAt?: string | null;
    kiteCoordinates: KiteCoordinates;
    blindspots?: Array<string>;
    strengths?: Array<string>;
    lfiScore: number;
    percentiles: Record<string, any>;
    cyclePhase?: string | null;
    backupStyle?: string | null;
};

