/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GrantsService {
    /**
     * Get My Grants
     * Get summary of active grants for the current user.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getMyGrantsApiV1GrantsMeGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/grants/me',
        });
    }
    /**
     * Get My Grants
     * Get summary of active grants for the current user.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getMyGrantsGrantsMeGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/grants/me',
        });
    }
}
