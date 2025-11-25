/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssessmentItemResponsePayload } from '../models/AssessmentItemResponsePayload';
import type { ForceFinalizeRequest } from '../models/ForceFinalizeRequest';
import type { OperationStatus } from '../models/OperationStatus';
import type { SessionOperationResult } from '../models/SessionOperationResult';
import type { SessionStartResponse } from '../models/SessionStartResponse';
import type { SessionSubmissionPayload } from '../models/SessionSubmissionPayload';
import type { SingleItemResponse } from '../models/SingleItemResponse';
import type { SingleItemResponsePayload } from '../models/SingleItemResponsePayload';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SessionsService {
    /**
     * Start Session
     * @param authorization
     * @returns SessionStartResponse Successful Response
     * @throws ApiError
     */
    public static startSessionSessionsStartPost(
        authorization?: (string | null),
    ): CancelablePromise<SessionStartResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/start',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Items
     * Fetch assessment items for a specific session.
     *
     * Security:
     * - Requires authentication.
     * - Enforces strict ownership: users can only access their own sessions.
     * - Returns 403 Forbidden if accessing another user's session.
     * @param sessionId
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getItemsSessionsSessionIdItemsGet(
        sessionId: number,
        authorization?: (string | null),
    ): CancelablePromise<Array<any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sessions/{session_id}/items',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * @deprecated
     * Submit Item
     * @param sessionId
     * @param itemId
     * @param requestBody
     * @param authorization
     * @returns OperationStatus Successful Response
     * @throws ApiError
     */
    public static submitItemSessionsSessionIdSubmitItemPost(
        sessionId: number,
        itemId: number,
        requestBody: Record<string, any>,
        authorization?: (string | null),
    ): CancelablePromise<OperationStatus> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/{session_id}/submit_item',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            query: {
                'item_id': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * @deprecated
     * Submit Context
     * @param sessionId
     * @param contextName
     * @param ce
     * @param ro
     * @param ac
     * @param ae
     * @param overwrite
     * @param authorization
     * @returns OperationStatus Successful Response
     * @throws ApiError
     */
    public static submitContextSessionsSessionIdSubmitContextPost(
        sessionId: number,
        contextName: string,
        ce: number,
        ro: number,
        ac: number,
        ae: number,
        overwrite: boolean = false,
        authorization?: (string | null),
    ): CancelablePromise<OperationStatus> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/{session_id}/submit_context',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            query: {
                'context_name': contextName,
                'CE': ce,
                'RO': ro,
                'AC': ac,
                'AE': ae,
                'overwrite': overwrite,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Submit All Responses
     * Batch submission of 12 learning-style items and 8 LFI contexts in a single transaction,
     * followed by finalize. This reduces chattiness (22 calls → 1) and ensures atomicity.
     * @param sessionId
     * @param requestBody
     * @param authorization
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static submitAllResponsesSessionsSessionIdSubmitAllResponsesPost(
        sessionId: number,
        requestBody: SessionSubmissionPayload,
        authorization?: (string | null),
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/{session_id}/submit_all_responses',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Finalize
     * @param sessionId
     * @param authorization
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static finalizeSessionsSessionIdFinalizePost(
        sessionId: number,
        authorization?: (string | null),
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/{session_id}/finalize',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Session Validation
     * Mengembalikan status kelengkapan sesi (item ipsatif & konteks LFI).
     * @param sessionId
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static sessionValidationSessionsSessionIdValidationGet(
        sessionId: number,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sessions/{session_id}/validation',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Force Finalize
     * @param sessionId
     * @param requestBody
     * @param authorization
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static forceFinalizeSessionsSessionIdForceFinalizePost(
        sessionId: number,
        requestBody: ForceFinalizeRequest,
        authorization?: (string | null),
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/{session_id}/force_finalize',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Submit Single Response
     * Real-time submission of a single item response (Walking Skeleton).
     * Maps dimension codes (CE, RO, AC, AE) to choice IDs and submits to runtime.
     * @param sessionId
     * @param requestBody
     * @param authorization
     * @returns SingleItemResponse Successful Response
     * @throws ApiError
     */
    public static submitSingleResponseSessionsSessionIdResponsePost(
        sessionId: number,
        requestBody: SingleItemResponsePayload,
        authorization?: (string | null),
    ): CancelablePromise<SingleItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/{session_id}/response',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upsert Session Responses
     * @param sessionId
     * @param requestBody
     * @param authorization
     * @returns void
     * @throws ApiError
     */
    public static upsertSessionResponsesSessionsSessionIdResponsesPatch(
        sessionId: number,
        requestBody: Array<AssessmentItemResponsePayload>,
        authorization?: (string | null),
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/sessions/{session_id}/responses',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
