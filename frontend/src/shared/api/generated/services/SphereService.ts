/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReflectionCreate } from '../models/ReflectionCreate';
import type { ReflectionOut } from '../models/ReflectionOut';
import type { ReflectionType } from '../models/ReflectionType';
import type { SphereNodeOut } from '../models/SphereNodeOut';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SphereService {
    /**
     * List Nodes
     * @param authorization
     * @returns SphereNodeOut Successful Response
     * @throws ApiError
     */
    public static listNodesSphereNodesGet(
        authorization?: (string | null),
    ): CancelablePromise<Array<SphereNodeOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sphere/nodes',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Reflections
     * @param reflectionType
     * @param authorization
     * @returns ReflectionOut Successful Response
     * @throws ApiError
     */
    public static listReflectionsSphereReflectionsGet(
        reflectionType?: (ReflectionType | null),
        authorization?: (string | null),
    ): CancelablePromise<Array<ReflectionOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sphere/reflections',
            headers: {
                'authorization': authorization,
            },
            query: {
                'reflection_type': reflectionType,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Reflection
     * @param requestBody
     * @param authorization
     * @returns ReflectionOut Successful Response
     * @throws ApiError
     */
    public static createReflectionSphereReflectionsPost(
        requestBody: ReflectionCreate,
        authorization?: (string | null),
    ): CancelablePromise<ReflectionOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sphere/reflections',
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
     * Get Prompt
     * @param authorization
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getPromptSpherePromptGet(
        authorization?: (string | null),
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sphere/prompt',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
