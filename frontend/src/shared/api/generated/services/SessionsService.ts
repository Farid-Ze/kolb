/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssessmentItemResponsePayload } from '../models/AssessmentItemResponsePayload';
import type { EngineSessionResponse } from '../models/EngineSessionResponse';
import type { SessionAutosavePayload } from '../models/SessionAutosavePayload';
import type { SessionListResponse } from '../models/SessionListResponse';
import type { SessionOperationResult } from '../models/SessionOperationResult';
import type { SessionStartResponse } from '../models/SessionStartResponse';
import type { SessionSubmissionPayload } from '../models/SessionSubmissionPayload';
import type { SessionUpdate } from '../models/SessionUpdate';
import type { StartSessionRequest } from '../models/StartSessionRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SessionsService {
    /**
     * List Sessions
     * List all assessment sessions for the current user.
     *
     * [Architecture Fix] Converted to async def to match async repository.
     * @param skip
     * @param limit
     * @returns SessionListResponse Successful Response
     * @throws ApiError
     */
    public static listSessionsApiV1SessionsGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<Array<SessionListResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sessions/',
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Start Session
     * Start a new assessment session.
     *
     * This is the primary entry point for starting an assessment.
     * Enforces Grant consumption (Phase 1: Semantic Pivot).
     * @param requestBody
     * @returns SessionStartResponse Successful Response
     * @throws ApiError
     */
    public static startSessionApiV1SessionsStartPost(
        requestBody: StartSessionRequest,
    ): CancelablePromise<SessionStartResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sessions/start',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Delivery
     * Fetch full delivery package including items, manifest, and locale resources.
     * This is the primary endpoint for retrieving assessment content.
     *
     * Args:
     * lite: If True, returns only manifest and structure (no item content).
     * Use for checking updates or lightweight sync.
     * @param sessionId
     * @param locale
     * @param lite
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getDeliveryApiV1SessionsSessionIdDeliveryGet(
        sessionId: string,
        locale?: string | null,
        lite: boolean = false,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sessions/{session_id}/delivery',
            path: {
                'session_id': sessionId,
            },
            query: {
                'locale': locale,
                'lite': lite,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getItemsApiV1SessionsSessionIdItemsGet(
        sessionId: string,
    ): CancelablePromise<Array<any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sessions/{session_id}/items',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Session State
     * Get full session state including responses and progress.
     * @param sessionId
     * @returns EngineSessionResponse Successful Response
     * @throws ApiError
     */
    public static getSessionStateApiV1SessionsSessionIdStateGet(
        sessionId: string,
    ): CancelablePromise<EngineSessionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sessions/{session_id}/state',
            path: {
                'session_id': sessionId,
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
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static submitAllResponsesApiV1SessionsSessionIdSubmitAllResponsesPost(
        sessionId: string,
        requestBody: SessionSubmissionPayload,
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sessions/{session_id}/submit-all-responses',
            path: {
                'session_id': sessionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Session
     * Update session state.
     *
     * - Set status='completed' to finalize the session.
     * @param sessionId
     * @param requestBody
     * @param idempotencyKey Unique key to prevent duplicate operations
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static updateSessionApiV1SessionsSessionIdPatch(
        sessionId: string,
        requestBody: SessionUpdate,
        idempotencyKey?: string | null,
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/sessions/{session_id}',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'idempotency-key': idempotencyKey,
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
     * Finalize
     * @param sessionId
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static finalizeApiV1SessionsSessionIdFinalizePost(
        sessionId: string,
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sessions/{session_id}/finalize',
            path: {
                'session_id': sessionId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static sessionValidationApiV1SessionsSessionIdValidationGet(
        sessionId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sessions/{session_id}/validation',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Autosave Session
     * Autosave partial progress (items and contexts).
     *
     * This endpoint supports the "Batch" strategy by allowing periodic saves
     * without triggering full submission logic.
     * @param sessionId
     * @param requestBody
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static autosaveSessionApiV1SessionsSessionIdAutosavePost(
        sessionId: string,
        requestBody: SessionAutosavePayload,
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sessions/{session_id}/autosave',
            path: {
                'session_id': sessionId,
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
     * Upsert session responses in batch (Async).
     *
     * [Architecture Fix] Converted to async def.
     * @param sessionId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static upsertSessionResponsesApiV1SessionsSessionIdResponsesPatch(
        sessionId: string,
        requestBody: Array<AssessmentItemResponsePayload>,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/sessions/{session_id}/responses',
            path: {
                'session_id': sessionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Sessions
     * List all assessment sessions for the current user.
     *
     * [Architecture Fix] Converted to async def to match async repository.
     * @param skip
     * @param limit
     * @returns SessionListResponse Successful Response
     * @throws ApiError
     */
    public static listSessionsSessionsGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<Array<SessionListResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sessions/',
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Start Session
     * Start a new assessment session.
     *
     * This is the primary entry point for starting an assessment.
     * Enforces Grant consumption (Phase 1: Semantic Pivot).
     * @param requestBody
     * @returns SessionStartResponse Successful Response
     * @throws ApiError
     */
    public static startSessionSessionsStartPost(
        requestBody: StartSessionRequest,
    ): CancelablePromise<SessionStartResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/start',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Delivery
     * Fetch full delivery package including items, manifest, and locale resources.
     * This is the primary endpoint for retrieving assessment content.
     *
     * Args:
     * lite: If True, returns only manifest and structure (no item content).
     * Use for checking updates or lightweight sync.
     * @param sessionId
     * @param locale
     * @param lite
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getDeliverySessionsSessionIdDeliveryGet(
        sessionId: string,
        locale?: string | null,
        lite: boolean = false,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sessions/{session_id}/delivery',
            path: {
                'session_id': sessionId,
            },
            query: {
                'locale': locale,
                'lite': lite,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getItemsSessionsSessionIdItemsGet(
        sessionId: string,
    ): CancelablePromise<Array<any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sessions/{session_id}/items',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Session State
     * Get full session state including responses and progress.
     * @param sessionId
     * @returns EngineSessionResponse Successful Response
     * @throws ApiError
     */
    public static getSessionStateSessionsSessionIdStateGet(
        sessionId: string,
    ): CancelablePromise<EngineSessionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sessions/{session_id}/state',
            path: {
                'session_id': sessionId,
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
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static submitAllResponsesSessionsSessionIdSubmitAllResponsesPost(
        sessionId: string,
        requestBody: SessionSubmissionPayload,
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/{session_id}/submit-all-responses',
            path: {
                'session_id': sessionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Session
     * Update session state.
     *
     * - Set status='completed' to finalize the session.
     * @param sessionId
     * @param requestBody
     * @param idempotencyKey Unique key to prevent duplicate operations
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static updateSessionSessionsSessionIdPatch(
        sessionId: string,
        requestBody: SessionUpdate,
        idempotencyKey?: string | null,
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/sessions/{session_id}',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'idempotency-key': idempotencyKey,
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
     * Finalize
     * @param sessionId
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static finalizeSessionsSessionIdFinalizePost(
        sessionId: string,
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/{session_id}/finalize',
            path: {
                'session_id': sessionId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static sessionValidationSessionsSessionIdValidationGet(
        sessionId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sessions/{session_id}/validation',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Autosave Session
     * Autosave partial progress (items and contexts).
     *
     * This endpoint supports the "Batch" strategy by allowing periodic saves
     * without triggering full submission logic.
     * @param sessionId
     * @param requestBody
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static autosaveSessionSessionsSessionIdAutosavePost(
        sessionId: string,
        requestBody: SessionAutosavePayload,
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sessions/{session_id}/autosave',
            path: {
                'session_id': sessionId,
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
     * Upsert session responses in batch (Async).
     *
     * [Architecture Fix] Converted to async def.
     * @param sessionId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static upsertSessionResponsesSessionsSessionIdResponsesPatch(
        sessionId: string,
        requestBody: Array<AssessmentItemResponsePayload>,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/sessions/{session_id}/responses',
            path: {
                'session_id': sessionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
