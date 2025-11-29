/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamOut } from './TeamOut';
/**
 * Paginated list of teams.
 *
 * Inherits pagination metadata from PaginatedResponse:
 * - items: List[TeamOut]
 * - total, page, size, pages
 */
export type TeamListResponse = {
    /**
     * List of items for the current page
     */
    items: Array<TeamOut>;
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

