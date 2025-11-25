/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StudyDataPoint } from './StudyDataPoint';
import type { StudyDataSummary } from './StudyDataSummary';
export type ResearchStudyDataOut = {
    studyId: number;
    studyTitle: string;
    filtersApplied: Record<string, any>;
    dataPoints: Array<StudyDataPoint>;
    summary: StudyDataSummary;
};

