/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContextRank } from './ContextRank';
import type { ItemRank } from './ItemRank';
import type { SessionStatus } from './SessionStatus';
export type EngineSessionResponse = {
    sessionId: string;
    instrumentCode: string;
    instrumentVersion?: string | null;
    status: SessionStatus;
    delivery?: any | null;
    responses: Array<ItemRank>;
    contexts: Array<ContextRank>;
    totalItems: number;
    completedItems: number;
    progress: number;
    currentItemIndex: number;
};

