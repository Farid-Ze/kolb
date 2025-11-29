/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamRollupMemberOut } from './TeamRollupMemberOut';
/**
 * Paginated team member analytics data.
 *
 * Inherits pagination metadata from PaginatedResponse:
 * - items: List[TeamRollupMemberOut]
 * - total, page, size, pages
 */
export type TeamMemberAnalyticsResponse = {
    /**
     * List of items for the current page
     */
    items: Array<TeamRollupMemberOut>;
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
};

