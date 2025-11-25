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
     * @param authorization
     * @returns UserOut Successful Response
     * @throws ApiError
     */
    public static getMeUsersMeGet(
        authorization?: (string | null),
    ): CancelablePromise<UserOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/me',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List User Achievements
     * @param authorization
     * @returns UserAchievementOut Successful Response
     * @throws ApiError
     */
    public static listUserAchievementsUsersMeAchievementsGet(
        authorization?: (string | null),
    ): CancelablePromise<Array<UserAchievementOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/me/achievements',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
