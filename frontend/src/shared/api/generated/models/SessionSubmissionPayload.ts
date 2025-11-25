/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContextRank } from './ContextRank';
import type { ItemRank } from './ItemRank';
export type SessionSubmissionPayload = {
    items: Array<ItemRank>;
    contexts: Array<ContextRank>;
    /**
     * Total duration spent by user in ms
     */
    clientDurationMs?: (number | null);
};

