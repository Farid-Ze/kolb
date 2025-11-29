/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssessmentItemResponsePayload } from '../models/AssessmentItemResponsePayload';
import type { SessionAutosavePayload } from '../models/SessionAutosavePayload';
import type { SessionOperationResult } from '../models/SessionOperationResult';
import type { SessionSubmissionPayload } from '../models/SessionSubmissionPayload';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SessionsService {
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
