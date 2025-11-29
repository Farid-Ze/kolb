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
     * @returns UserChallengeOut Successful Response
     * @throws ApiError
     */
    public static listUserChallengesChallengesUserGet(): CancelablePromise<Array<UserChallengeOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/challenges/user',
        });
    }
    /**
     * Complete User Challenge
     * @param challengeId
     * @param requestBody
     * @returns UserChallengeOut Successful Response
     * @throws ApiError
     */
    public static completeUserChallengeChallengesUserChallengeIdCompletePost(
        challengeId: number,
        requestBody: ChallengeCompletionPayload,
    ): CancelablePromise<UserChallengeOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/challenges/user/{challenge_id}/complete',
            path: {
                'challenge_id': challengeId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
