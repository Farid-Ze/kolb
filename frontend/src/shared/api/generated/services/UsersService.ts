/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserAchievementOut } from '../models/UserAchievementOut';
import type { UserOut } from '../models/UserOut';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Get Me
     * @returns UserOut Successful Response
     * @throws ApiError
     */
    public static getMeApiV1UsersMeGet(): CancelablePromise<UserOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me',
        });
    }
    /**
     * List User Achievements
     * @returns UserAchievementOut Successful Response
     * @throws ApiError
     */
    public static listUserAchievementsApiV1UsersMeAchievementsGet(): CancelablePromise<Array<UserAchievementOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me/achievements',
        });
    }
    /**
     * Get Me
     * @returns UserOut Successful Response
     * @throws ApiError
     */
    public static getMeUsersMeGet(): CancelablePromise<UserOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/me',
        });
    }
    /**
     * List User Achievements
     * @returns UserAchievementOut Successful Response
     * @throws ApiError
     */
    public static listUserAchievementsUsersMeAchievementsGet(): CancelablePromise<Array<UserAchievementOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/me/achievements',
        });
    }
}
