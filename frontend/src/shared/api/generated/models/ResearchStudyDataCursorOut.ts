/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StudyDataPoint } from './StudyDataPoint';
import type { StudyDataSummary } from './StudyDataSummary';
/**
 * Cursor-paginated research study data export with metadata.
 */
export type ResearchStudyDataCursorOut = {
    /**
     * List of items for the current page
     */
    items: Array<StudyDataPoint>;
    /**
     * Cursor for the next page. Null if no more items.
     */
    nextCursor?: string | null;
    /**
     * Cursor for the previous page.
     */
    prevCursor?: string | null;
    /**
     * Number of items per page
     */
    size: number;
    studyPublicId: string;
    studyTitle: string;
    filtersApplied: Record<string, any>;
    summary: StudyDataSummary;
    /**
     * Cronbach's Alpha per dimension
     */
    reliabilityStats?: any | null;
    /**
     * Standard Error of Measurement per dimension
     */
    semStats?: any | null;
};

