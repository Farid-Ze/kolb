/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IndividualReportPayload } from '../models/IndividualReportPayload';
import type { ReportShareCreate } from '../models/ReportShareCreate';
import type { ReportShareOut } from '../models/ReportShareOut';
import type { ReportSummaryPayload } from '../models/ReportSummaryPayload';
import type { TeamReportPayload } from '../models/TeamReportPayload';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportsService {
    /**
     * Get My Reports
     * @returns ReportSummaryPayload Successful Response
     * @throws ApiError
     */
    public static getMyReportsApiV1ReportsSelfGet(): CancelablePromise<Array<ReportSummaryPayload>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/self',
        });
    }
    /**
     * Get Report
     * @param sessionId
     * @param xGuestToken
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getReportApiV1ReportsSessionIdGet(
        sessionId: string,
        xGuestToken?: string | null,
    ): CancelablePromise<(IndividualReportPayload | TeamReportPayload)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/{session_id}',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'X-Guest-Token': xGuestToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Report Share
     * @param sessionId
     * @param requestBody
     * @returns ReportShareOut Successful Response
     * @throws ApiError
     */
    public static createReportShareApiV1ReportsSessionIdSharePost(
        sessionId: string,
        requestBody: ReportShareCreate,
    ): CancelablePromise<ReportShareOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reports/{session_id}/share',
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
     * Get Shared Report
     * @param shareToken
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSharedReportApiV1ReportsSharedShareTokenGet(
        shareToken: string,
    ): CancelablePromise<(IndividualReportPayload | TeamReportPayload)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/shared/{share_token}',
            path: {
                'share_token': shareToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get My Reports
     * @returns ReportSummaryPayload Successful Response
     * @throws ApiError
     */
    public static getMyReportsReportsSelfGet(): CancelablePromise<Array<ReportSummaryPayload>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reports/self',
        });
    }
    /**
     * Get Report
     * @param sessionId
     * @param xGuestToken
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getReportReportsSessionIdGet(
        sessionId: string,
        xGuestToken?: string | null,
    ): CancelablePromise<(IndividualReportPayload | TeamReportPayload)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reports/{session_id}',
            path: {
                'session_id': sessionId,
            },
            headers: {
                'X-Guest-Token': xGuestToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Report Share
     * @param sessionId
     * @param requestBody
     * @returns ReportShareOut Successful Response
     * @throws ApiError
     */
    public static createReportShareReportsSessionIdSharePost(
        sessionId: string,
        requestBody: ReportShareCreate,
    ): CancelablePromise<ReportShareOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/reports/{session_id}/share',
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
     * Get Shared Report
     * @param shareToken
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSharedReportReportsSharedShareTokenGet(
        shareToken: string,
    ): CancelablePromise<(IndividualReportPayload | TeamReportPayload)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reports/shared/{share_token}',
            path: {
                'share_token': shareToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
