/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssessmentSessionResponse } from '../models/AssessmentSessionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AssessmentsService {
    /**
     * Get Latest Assessment
     * Get the latest completed assessment session for the current user.
     *
     * This endpoint is strictly scoped to the authenticated user. It retrieves the most
     * recent session with status 'completed' and maps the internal ORM model to a
     * frontend-friendly DTO.
     *
     * Returns:
     * AssessmentSessionResponse: The latest completed session with results.
     * None: If the user has no completed sessions (returns 200 OK with null body).
     *
     * Raises:
     * HTTPException(401): If the user is not authenticated.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getLatestAssessmentApiV1AssessmentsLatestGet(): CancelablePromise<(AssessmentSessionResponse | null)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/assessments/latest',
        });
    }
}
