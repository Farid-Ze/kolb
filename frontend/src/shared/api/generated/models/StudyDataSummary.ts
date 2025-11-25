/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StudyDataDateRange } from './StudyDataDateRange';
export type StudyDataSummary = {
    totalSessions: number;
    uniqueParticipants: number;
    dateRange?: (StudyDataDateRange | null);
    styleDistribution: Record<string, number>;
};

