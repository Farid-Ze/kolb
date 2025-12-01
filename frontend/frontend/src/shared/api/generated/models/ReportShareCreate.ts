/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReportShareCreate = {
    /**
     * Email mediator yang diberi akses
     */
    mediatorEmail: string;
    /**
     * Durasi link berlaku dalam jam (maks 14 hari)
     */
    expiresInHours?: number;
    note?: string | null;
};

