/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssessmentResultsResponse } from '../models/AssessmentResultsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResultsService {
    /**
     * Get Latest Results
     * @param authorization
     * @returns AssessmentResultsResponse Successful Response
     * @throws ApiError
     */
    public static getLatestResultsResultsLatestGet(
        authorization?: (string | null),
    ): CancelablePromise<AssessmentResultsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/results/latest',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Latest Results Alias
     * Alias endpoint to match Zenotika SSOT sitemap.
     *
     * Provides the same payload as /results/latest but under a sessions-oriented path.
     * @param authorization
     * @returns AssessmentResultsResponse Successful Response
     * @throws ApiError
     */
    public static getLatestResultsAliasResultsSessionsLatestGet(
        authorization?: (string | null),
    ): CancelablePromise<AssessmentResultsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/results/sessions/latest',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
