/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReliabilityCreate } from '../models/ReliabilityCreate';
import type { ResearchStudyCreate } from '../models/ResearchStudyCreate';
import type { ResearchStudyDataOut } from '../models/ResearchStudyDataOut';
import type { ResearchStudyOut } from '../models/ResearchStudyOut';
import type { ResearchStudyUpdate } from '../models/ResearchStudyUpdate';
import type { ValidityCreate } from '../models/ValidityCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResearchService {
    /**
     * Create Study
     * @param requestBody
     * @param authorization
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static createStudyResearchStudiesPost(
        requestBody: ResearchStudyCreate,
        authorization?: (string | null),
    ): CancelablePromise<ResearchStudyOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/research/studies',
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
     * List Studies
     * @param skip
     * @param limit
     * @param q
     * @param authorization
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static listStudiesResearchStudiesGet(
        skip?: number,
        limit: number = 50,
        q?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<Array<ResearchStudyOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/research/studies',
            headers: {
                'authorization': authorization,
            },
            query: {
                'skip': skip,
                'limit': limit,
                'q': q,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Study
     * @param studyId
     * @param authorization
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static getStudyResearchStudiesStudyIdGet(
        studyId: number,
        authorization?: (string | null),
    ): CancelablePromise<ResearchStudyOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/research/studies/{study_id}',
            path: {
                'study_id': studyId,
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
     * Update Study
     * @param studyId
     * @param requestBody
     * @param authorization
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static updateStudyResearchStudiesStudyIdPatch(
        studyId: number,
        requestBody: ResearchStudyUpdate,
        authorization?: (string | null),
    ): CancelablePromise<ResearchStudyOut> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/research/studies/{study_id}',
            path: {
                'study_id': studyId,
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
     * Delete Study
     * @param studyId
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteStudyResearchStudiesStudyIdDelete(
        studyId: number,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/research/studies/{study_id}',
            path: {
                'study_id': studyId,
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
     * Add Reliability
     * @param studyId
     * @param requestBody
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addReliabilityResearchStudiesStudyIdReliabilityPost(
        studyId: number,
        requestBody: ReliabilityCreate,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/research/studies/{study_id}/reliability',
            path: {
                'study_id': studyId,
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
     * List Reliability
     * @param studyId
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listReliabilityResearchStudiesStudyIdReliabilityGet(
        studyId: number,
        authorization?: (string | null),
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/research/studies/{study_id}/reliability',
            path: {
                'study_id': studyId,
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
     * Add Validity
     * @param studyId
     * @param requestBody
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addValidityResearchStudiesStudyIdValidityPost(
        studyId: number,
        requestBody: ValidityCreate,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/research/studies/{study_id}/validity',
            path: {
                'study_id': studyId,
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
     * List Validity
     * @param studyId
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listValidityResearchStudiesStudyIdValidityGet(
        studyId: number,
        authorization?: (string | null),
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/research/studies/{study_id}/validity',
            path: {
                'study_id': studyId,
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
     * Get Study Data
     * @param studyId
     * @param startDate
     * @param endDate
     * @param learningStyle
     * @param normGroup
     * @param userEmail
     * @param authorization
     * @returns ResearchStudyDataOut Successful Response
     * @throws ApiError
     */
    public static getStudyDataResearchStudiesStudyIdDataGet(
        studyId: number,
        startDate?: (string | null),
        endDate?: (string | null),
        learningStyle?: (string | null),
        normGroup?: (string | null),
        userEmail?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<ResearchStudyDataOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/research/studies/{study_id}/data',
            path: {
                'study_id': studyId,
            },
            headers: {
                'authorization': authorization,
            },
            query: {
                'start_date': startDate,
                'end_date': endDate,
                'learning_style': learningStyle,
                'norm_group': normGroup,
                'user_email': userEmail,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
