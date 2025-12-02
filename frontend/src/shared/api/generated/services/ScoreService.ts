/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScorePreviewRequest } from '../models/ScorePreviewRequest';
import type { ScorePreviewResponse } from '../models/ScorePreviewResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ScoreService {
    /**
     * Score Raw
     * @param requestBody
     * @returns ScorePreviewResponse Successful Response
     * @throws ApiError
     */
    public static scoreRawApiV1ScoreRawPost(
        requestBody: ScorePreviewRequest,
    ): CancelablePromise<ScorePreviewResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/score/raw',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Score Raw
     * @param requestBody
     * @returns ScorePreviewResponse Successful Response
     * @throws ApiError
     */
    public static scoreRawScoreRawPost(
        requestBody: ScorePreviewRequest,
    ): CancelablePromise<ScorePreviewResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/score/raw',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
