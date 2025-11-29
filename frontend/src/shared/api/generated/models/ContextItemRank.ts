/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Raw ranking for a specific context scenario (Audit Point 1).
 */
export type ContextItemRank = {
    /**
     * ID of the context scenario (1-8)
     */
    contextId: number;
    /**
     * Map of choice_id to rank (1-4). Must be unique per context.
     */
    ranks: Record<string, number>;
};

