/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionStatus } from './SessionStatus';
export type SessionListResponse = {
    id: string;
    startTime: string;
    endTime?: string | null;
    status: SessionStatus;
    assessmentId: string;
    assessmentVersion: string;
};

