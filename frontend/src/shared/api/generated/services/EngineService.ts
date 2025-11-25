/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ForceFinalizeRequest } from '../models/ForceFinalizeRequest';
import type { OperationStatus } from '../models/OperationStatus';
import type { ReportPayload } from '../models/ReportPayload';
import type { SessionAutosavePayload } from '../models/SessionAutosavePayload';
import type { SessionListResponse } from '../models/SessionListResponse';
import type { SessionOperationResult } from '../models/SessionOperationResult';
import type { SessionStartResponse } from '../models/SessionStartResponse';
import type { SessionSubmissionPayload } from '../models/SessionSubmissionPayload';
import type { StartSessionRequest } from '../models/StartSessionRequest';
import type { SubmissionPayload } from '../models/SubmissionPayload';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EngineService {
    /**
     * List Sessions
     * List all assessment sessions for the current user.
     * @param skip
     * @param limit
     * @param authorization
     * @returns SessionListResponse Successful Response
     * @throws ApiError
     */
    public static listSessionsEngineSessionsGet(
        skip?: number,
        limit: number = 100,
        authorization?: (string | null),
    ): CancelablePromise<Array<SessionListResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/engine/sessions/',
            headers: {
                'authorization': authorization,
            },
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
     * List Instruments
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listInstrumentsEngineInstrumentsGet(
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/engine/instruments',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Instrument Manifest
     * @param instrumentCode
     * @param instrumentVersion
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getInstrumentManifestEngineInstrumentsInstrumentCodeInstrumentVersionGet(
        instrumentCode: string,
        instrumentVersion: string,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/engine/instruments/{instrument_code}/{instrument_version}',
            path: {
                'instrument_code': instrumentCode,
                'instrument_version': instrumentVersion,
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
     * Get Instrument Locale Resource Endpoint
     * @param instrumentCode
     * @param instrumentVersion
     * @param locale
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getInstrumentLocaleResourceEndpointEngineInstrumentsInstrumentCodeInstrumentVersionResourcesLocaleGet(
        instrumentCode: string,
        instrumentVersion: string,
        locale: string,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/engine/instruments/{instrument_code}/{instrument_version}/resources/{locale}',
            path: {
                'instrument_code': instrumentCode,
                'instrument_version': instrumentVersion,
                'locale': locale,
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
     * Start Engine Session
     * @param requestBody
     * @param authorization
     * @returns SessionStartResponse Successful Response
     * @throws ApiError
     */
    public static startEngineSessionEngineSessionsStartPost(
        requestBody: StartSessionRequest,
        authorization?: (string | null),
    ): CancelablePromise<SessionStartResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/engine/sessions/start',
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
     * Get Delivery
     * @param sessionId
     * @param locale
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getDeliveryEngineSessionsSessionIdDeliveryGet(
        sessionId: number,
        locale?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/engine/sessions/{session_id}/delivery',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            query: {
                'locale': locale,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Session Items
     * @param sessionId
     * @param locale
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSessionItemsEngineSessionsSessionIdItemsGet(
        sessionId: number,
        locale?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/engine/sessions/{session_id}/items',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            query: {
                'locale': locale,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Autosave Session Items
     * @param sessionId
     * @param requestBody
     * @param locale
     * @param authorization
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static autosaveSessionItemsEngineSessionsSessionIdItemsPost(
        sessionId: number,
        requestBody: SessionAutosavePayload,
        locale?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/engine/sessions/{session_id}/items',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'authorization': authorization,
            },
            query: {
                'locale': locale,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Submit All Responses
     * Accept 12 learning-style items and 8 LFI contexts in a single request and finalize atomically (Sync).
     * @param sessionId
     * @param requestBody
     * @param authorization
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static submitAllResponsesEngineSessionsSessionIdSubmitAllPost(
        sessionId: number,
        requestBody: SessionSubmissionPayload,
        authorization?: (string | null),
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/engine/sessions/{session_id}/submit_all',
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
     * Submit Interaction
     * Backward-compatible single interaction submission (deprecated).
     * Retained to support existing clients and tests; prefer submit_all.
     * @param sessionId
     * @param requestBody
     * @param authorization
     * @returns OperationStatus Successful Response
     * @throws ApiError
     */
    public static submitInteractionEngineSessionsSessionIdInteractionsPost(
        sessionId: number,
        requestBody: SubmissionPayload,
        authorization?: (string | null),
    ): CancelablePromise<OperationStatus> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/engine/sessions/{session_id}/interactions',
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
     * Engine Metrics
     * @param reset
     * @param includeLastRuns
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static engineMetricsEngineMetricsGet(
        reset: boolean = false,
        includeLastRuns: boolean = true,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/engine/metrics',
            headers: {
                'authorization': authorization,
            },
            query: {
                'reset': reset,
                'include_last_runs': includeLastRuns,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Finalize Session
     * @param sessionId
     * @param authorization
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static finalizeSessionEngineSessionsSessionIdFinalizePost(
        sessionId: number,
        authorization?: (string | null),
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/engine/sessions/{session_id}/finalize',
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
     * Validation Snapshot
     * Expose run_session_validations snapshot via engine router.
     * @param sessionId
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static validationSnapshotEngineSessionsSessionIdValidationGet(
        sessionId: number,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/engine/sessions/{session_id}/validation',
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
     * Engine Report
     * @param sessionId
     * @param authorization
     * @returns ReportPayload Successful Response
     * @throws ApiError
     */
    public static engineReportEngineSessionsSessionIdReportGet(
        sessionId: number,
        authorization?: (string | null),
    ): CancelablePromise<ReportPayload> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/engine/sessions/{session_id}/report',
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
     * Force Finalize Session
     * @param sessionId
     * @param requestBody
     * @param authorization
     * @returns SessionOperationResult Successful Response
     * @throws ApiError
     */
    public static forceFinalizeSessionEngineSessionsSessionIdForceFinalizePost(
        sessionId: number,
        requestBody: ForceFinalizeRequest,
        authorization?: (string | null),
    ): CancelablePromise<SessionOperationResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/engine/sessions/{session_id}/force-finalize',
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
