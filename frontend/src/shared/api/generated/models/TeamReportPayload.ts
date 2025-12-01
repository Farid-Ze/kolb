/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TeamReportPayload = {
    sessionId: string;
    generatedAt?: string | null;
    kind?: TeamReportPayload.kind;
    teamId: number;
    analytics?: any | null;
};
export namespace TeamReportPayload {
    export enum kind {
        TEAM = 'team',
    }
}

