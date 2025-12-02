/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReliabilityCreate } from '../models/ReliabilityCreate';
import type { ReliabilityOut } from '../models/ReliabilityOut';
import type { ResearchStudyCreate } from '../models/ResearchStudyCreate';
import type { ResearchStudyDataCursorOut } from '../models/ResearchStudyDataCursorOut';
import type { ResearchStudyDataOut } from '../models/ResearchStudyDataOut';
import type { ResearchStudyOut } from '../models/ResearchStudyOut';
import type { ResearchStudyUpdate } from '../models/ResearchStudyUpdate';
import type { StudyDataFilter } from '../models/StudyDataFilter';
import type { ValidityCreate } from '../models/ValidityCreate';
import type { ValidityOut } from '../models/ValidityOut';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResearchService {
    /**
     * Create Study
     * @param requestBody
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static createStudyApiV1ResearchStudiesPost(
        requestBody: ResearchStudyCreate,
    ): CancelablePromise<ResearchStudyOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/research/studies',
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
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static listStudiesApiV1ResearchStudiesGet(
        skip?: number,
        limit: number = 50,
        q?: string | null,
    ): CancelablePromise<Array<ResearchStudyOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/research/studies',
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
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static getStudyApiV1ResearchStudiesStudyIdGet(
        studyId: string,
    ): CancelablePromise<ResearchStudyOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/research/studies/{study_id}',
            path: {
                'study_id': studyId,
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
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static updateStudyApiV1ResearchStudiesStudyIdPatch(
        studyId: string,
        requestBody: ResearchStudyUpdate,
    ): CancelablePromise<ResearchStudyOut> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/research/studies/{study_id}',
            path: {
                'study_id': studyId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteStudyApiV1ResearchStudiesStudyIdDelete(
        studyId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/research/studies/{study_id}',
            path: {
                'study_id': studyId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addReliabilityApiV1ResearchStudiesStudyIdReliabilityPost(
        studyId: string,
        requestBody: ReliabilityCreate,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/research/studies/{study_id}/reliability',
            path: {
                'study_id': studyId,
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
     * @returns ReliabilityOut Successful Response
     * @throws ApiError
     */
    public static listReliabilityApiV1ResearchStudiesStudyIdReliabilityGet(
        studyId: string,
    ): CancelablePromise<Array<ReliabilityOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/research/studies/{study_id}/reliability',
            path: {
                'study_id': studyId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addValidityApiV1ResearchStudiesStudyIdValidityPost(
        studyId: string,
        requestBody: ValidityCreate,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/research/studies/{study_id}/validity',
            path: {
                'study_id': studyId,
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
     * @returns ValidityOut Successful Response
     * @throws ApiError
     */
    public static listValidityApiV1ResearchStudiesStudyIdValidityGet(
        studyId: string,
    ): CancelablePromise<Array<ValidityOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/research/studies/{study_id}/validity',
            path: {
                'study_id': studyId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Study Data
     * @param studyId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getStudyDataApiV1ResearchStudiesStudyIdDataPost(
        studyId: string,
        requestBody: StudyDataFilter,
    ): CancelablePromise<(ResearchStudyDataOut | ResearchStudyDataCursorOut)> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/research/studies/{study_id}/data',
            path: {
                'study_id': studyId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Study
     * @param requestBody
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static createStudyResearchStudiesPost(
        requestBody: ResearchStudyCreate,
    ): CancelablePromise<ResearchStudyOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/research/studies',
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
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static listStudiesResearchStudiesGet(
        skip?: number,
        limit: number = 50,
        q?: string | null,
    ): CancelablePromise<Array<ResearchStudyOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/research/studies',
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
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static getStudyResearchStudiesStudyIdGet(
        studyId: string,
    ): CancelablePromise<ResearchStudyOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/research/studies/{study_id}',
            path: {
                'study_id': studyId,
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
     * @returns ResearchStudyOut Successful Response
     * @throws ApiError
     */
    public static updateStudyResearchStudiesStudyIdPatch(
        studyId: string,
        requestBody: ResearchStudyUpdate,
    ): CancelablePromise<ResearchStudyOut> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/research/studies/{study_id}',
            path: {
                'study_id': studyId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteStudyResearchStudiesStudyIdDelete(
        studyId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/research/studies/{study_id}',
            path: {
                'study_id': studyId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addReliabilityResearchStudiesStudyIdReliabilityPost(
        studyId: string,
        requestBody: ReliabilityCreate,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/research/studies/{study_id}/reliability',
            path: {
                'study_id': studyId,
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
     * @returns ReliabilityOut Successful Response
     * @throws ApiError
     */
    public static listReliabilityResearchStudiesStudyIdReliabilityGet(
        studyId: string,
    ): CancelablePromise<Array<ReliabilityOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/research/studies/{study_id}/reliability',
            path: {
                'study_id': studyId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addValidityResearchStudiesStudyIdValidityPost(
        studyId: string,
        requestBody: ValidityCreate,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/research/studies/{study_id}/validity',
            path: {
                'study_id': studyId,
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
     * @returns ValidityOut Successful Response
     * @throws ApiError
     */
    public static listValidityResearchStudiesStudyIdValidityGet(
        studyId: string,
    ): CancelablePromise<Array<ValidityOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/research/studies/{study_id}/validity',
            path: {
                'study_id': studyId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Study Data
     * @param studyId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getStudyDataResearchStudiesStudyIdDataPost(
        studyId: string,
        requestBody: StudyDataFilter,
    ): CancelablePromise<(ResearchStudyDataOut | ResearchStudyDataCursorOut)> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/research/studies/{study_id}/data',
            path: {
                'study_id': studyId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
