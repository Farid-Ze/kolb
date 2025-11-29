/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StudyDataPoint } from './StudyDataPoint';
import type { StudyDataSummary } from './StudyDataSummary';
/**
 * Paginated research study data export with metadata.
 *
 * Extends PaginatedResponse to include study-specific metadata:
 * - items: List[StudyDataPoint] (inherited, contains paginated data points)
 * - total, page, size, pages (inherited pagination metadata)
 * - study_public_id, study_title, filters_applied, summary (custom fields)
 */
export type ResearchStudyDataOut = {
    /**
     * List of items for the current page
     */
    items: Array<StudyDataPoint>;
    /**
     * Total count of all items across all pages
     */
    total: number;
    /**
     * Current page number (1-indexed)
     */
    page: number;
    /**
     * Number of items per page
     */
    size: number;
    /**
     * Total number of pages
     */
    pages: number;
    studyPublicId: string;
    studyTitle: string;
    filtersApplied: Record<string, any>;
    summary: StudyDataSummary;
};

