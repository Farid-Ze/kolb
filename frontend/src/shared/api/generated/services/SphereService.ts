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
     * @returns SphereNodeOut Successful Response
     * @throws ApiError
     */
    public static listNodesApiV1SphereNodesGet(): CancelablePromise<Array<SphereNodeOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sphere/nodes',
        });
    }
    /**
     * List Reflections
     * @param reflectionType
     * @returns ReflectionOut Successful Response
     * @throws ApiError
     */
    public static listReflectionsApiV1SphereReflectionsGet(
        reflectionType?: (ReflectionType | null),
    ): CancelablePromise<Array<ReflectionOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sphere/reflections',
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
     * @returns ReflectionOut Successful Response
     * @throws ApiError
     */
    public static createReflectionApiV1SphereReflectionsPost(
        requestBody: ReflectionCreate,
    ): CancelablePromise<ReflectionOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sphere/reflections',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Prompt
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getPromptApiV1SpherePromptGet(): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sphere/prompt',
        });
    }
    /**
     * List Nodes
     * @returns SphereNodeOut Successful Response
     * @throws ApiError
     */
    public static listNodesSphereNodesGet(): CancelablePromise<Array<SphereNodeOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sphere/nodes',
        });
    }
    /**
     * List Reflections
     * @param reflectionType
     * @returns ReflectionOut Successful Response
     * @throws ApiError
     */
    public static listReflectionsSphereReflectionsGet(
        reflectionType?: (ReflectionType | null),
    ): CancelablePromise<Array<ReflectionOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sphere/reflections',
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
     * @returns ReflectionOut Successful Response
     * @throws ApiError
     */
    public static createReflectionSphereReflectionsPost(
        requestBody: ReflectionCreate,
    ): CancelablePromise<ReflectionOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sphere/reflections',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Prompt
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getPromptSpherePromptGet(): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sphere/prompt',
        });
    }
}
