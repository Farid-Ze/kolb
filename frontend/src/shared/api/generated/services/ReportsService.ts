/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportPayload } from '../models/ReportPayload';
import type { ReportShareCreate } from '../models/ReportShareCreate';
import type { ReportShareOut } from '../models/ReportShareOut';
import type { ReportSummaryPayload } from '../models/ReportSummaryPayload';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportsService {
    /**
     * List Self Reports
     * @param authorization
     * @returns ReportSummaryPayload Successful Response
     * @throws ApiError
     */
    public static listSelfReportsReportsSelfGet(
        authorization?: (string | null),
    ): CancelablePromise<Array<ReportSummaryPayload>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reports/self',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Report
     * @param sessionId
     * @param authorization
     * @returns ReportPayload Successful Response
     * @throws ApiError
     */
    public static getReportReportsSessionIdGet(
        sessionId: number,
        authorization?: (string | null),
    ): CancelablePromise<ReportPayload> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reports/{session_id}',
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
     * Create Report Share
     * @param sessionId
     * @param requestBody
     * @param authorization
     * @returns ReportShareOut Successful Response
     * @throws ApiError
     */
    public static createReportShareReportsSessionIdSharePost(
        sessionId: number,
        requestBody: ReportShareCreate,
        authorization?: (string | null),
    ): CancelablePromise<ReportShareOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/reports/{session_id}/share',
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
     * Get Shared Report
     * @param shareToken
     * @param authorization
     * @returns ReportPayload Successful Response
     * @throws ApiError
     */
    public static getSharedReportReportsSharedShareTokenGet(
        shareToken: string,
        authorization?: (string | null),
    ): CancelablePromise<ReportPayload> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reports/shared/{share_token}',
            path: {
                'share_token': shareToken,
            },
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
