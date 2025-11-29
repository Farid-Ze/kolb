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
     * @returns AssessmentResultsResponse Successful Response
     * @throws ApiError
     */
    public static getLatestResultsResultsLatestGet(): CancelablePromise<AssessmentResultsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/results/latest',
        });
    }
    /**
     * Get Latest Results Alias
     * Alias endpoint to match Zenotika SSOT sitemap.
     *
     * Provides the same payload as /results/latest but under a sessions-oriented path.
     * @returns AssessmentResultsResponse Successful Response
     * @throws ApiError
     */
    public static getLatestResultsAliasResultsSessionsLatestGet(): CancelablePromise<AssessmentResultsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/results/sessions/latest',
        });
    }
}
