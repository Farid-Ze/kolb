/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChallengeCompletionPayload } from '../models/ChallengeCompletionPayload';
import type { UserChallengeOut } from '../models/UserChallengeOut';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChallengesService {
    /**
     * List User Challenges
     * @param authorization
     * @returns UserChallengeOut Successful Response
     * @throws ApiError
     */
    public static listUserChallengesChallengesUserGet(
        authorization?: (string | null),
    ): CancelablePromise<Array<UserChallengeOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/challenges/user',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Complete User Challenge
     * @param challengeId
     * @param requestBody
     * @param authorization
     * @returns UserChallengeOut Successful Response
     * @throws ApiError
     */
    public static completeUserChallengeChallengesUserChallengeIdCompletePost(
        challengeId: number,
        requestBody: ChallengeCompletionPayload,
        authorization?: (string | null),
    ): CancelablePromise<UserChallengeOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/challenges/user/{challenge_id}/complete',
            path: {
                'challenge_id': challengeId,
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
}
