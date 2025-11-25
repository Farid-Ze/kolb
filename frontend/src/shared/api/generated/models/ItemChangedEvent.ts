/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Captures when a user changes their answer (rank) for an item.
 */
export type ItemChangedEvent = {
    sessionId: number;
    itemId: number;
    fromRank?: (number | null);
    toRank: number;
    timestampMs: number;
};

