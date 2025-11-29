/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReliabilityCreate } from '../models/ReliabilityCreate';
import type { ResearchStudyCreate } from '../models/ResearchStudyCreate';
import type { ResearchStudyDataOut } from '../models/ResearchStudyDataOut';
import type { ResearchStudyOut } from '../models/ResearchStudyOut';
import type { ResearchStudyUpdate } from '../models/ResearchStudyUpdate';
import type { StudyDataFilter } from '../models/StudyDataFilter';
import type { ValidityCreate } from '../models/ValidityCreate';
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listReliabilityResearchStudiesStudyIdReliabilityGet(
        studyId: string,
    ): CancelablePromise<Array<Record<string, any>>> {
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listValidityResearchStudiesStudyIdValidityGet(
        studyId: string,
    ): CancelablePromise<Array<Record<string, any>>> {
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
     * @returns ResearchStudyDataOut Successful Response
     * @throws ApiError
     */
    public static getStudyDataResearchStudiesStudyIdDataPost(
        studyId: string,
        requestBody: StudyDataFilter,
    ): CancelablePromise<ResearchStudyDataOut> {
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
