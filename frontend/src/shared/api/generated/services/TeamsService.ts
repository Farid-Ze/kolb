/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamCreate } from '../models/TeamCreate';
import type { TeamMemberAdd } from '../models/TeamMemberAdd';
import type { TeamMemberOut } from '../models/TeamMemberOut';
import type { TeamOut } from '../models/TeamOut';
import type { TeamRollupDetail } from '../models/TeamRollupDetail';
import type { TeamRollupOut } from '../models/TeamRollupOut';
import type { TeamUpdate } from '../models/TeamUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TeamsService {
    /**
     * Create Team
     * @param requestBody
     * @param authorization
     * @returns TeamOut Successful Response
     * @throws ApiError
     */
    public static createTeamTeamsPost(
        requestBody: TeamCreate,
        authorization?: (string | null),
    ): CancelablePromise<TeamOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/teams/',
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
     * List Teams
     * @param skip
     * @param limit
     * @param q
     * @returns TeamOut Successful Response
     * @throws ApiError
     */
    public static listTeamsTeamsGet(
        skip?: number,
        limit: number = 50,
        q?: (string | null),
    ): CancelablePromise<Array<TeamOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/teams/',
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
     * Get Team
     * @param teamId
     * @returns TeamOut Successful Response
     * @throws ApiError
     */
    public static getTeamTeamsTeamIdGet(
        teamId: number,
    ): CancelablePromise<TeamOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/teams/{team_id}',
            path: {
                'team_id': teamId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Team
     * @param teamId
     * @param requestBody
     * @param authorization
     * @returns TeamOut Successful Response
     * @throws ApiError
     */
    public static updateTeamTeamsTeamIdPatch(
        teamId: number,
        requestBody: TeamUpdate,
        authorization?: (string | null),
    ): CancelablePromise<TeamOut> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/teams/{team_id}',
            path: {
                'team_id': teamId,
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
     * Delete Team
     * @param teamId
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteTeamTeamsTeamIdDelete(
        teamId: number,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/teams/{team_id}',
            path: {
                'team_id': teamId,
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
     * List Members
     * @param teamId
     * @returns TeamMemberOut Successful Response
     * @throws ApiError
     */
    public static listMembersTeamsTeamIdMembersGet(
        teamId: number,
    ): CancelablePromise<Array<TeamMemberOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/teams/{team_id}/members',
            path: {
                'team_id': teamId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Member
     * @param teamId
     * @param requestBody
     * @param authorization
     * @returns TeamMemberOut Successful Response
     * @throws ApiError
     */
    public static addMemberTeamsTeamIdMembersPost(
        teamId: number,
        requestBody: TeamMemberAdd,
        authorization?: (string | null),
    ): CancelablePromise<TeamMemberOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/teams/{team_id}/members',
            path: {
                'team_id': teamId,
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
     * Remove Member
     * @param teamId
     * @param memberId
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static removeMemberTeamsTeamIdMembersMemberIdDelete(
        teamId: number,
        memberId: number,
        authorization?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/teams/{team_id}/members/{member_id}',
            path: {
                'team_id': teamId,
                'member_id': memberId,
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
     * List Rollups
     * @param teamId
     * @returns TeamRollupOut Successful Response
     * @throws ApiError
     */
    public static listRollupsTeamsTeamIdRollupsGet(
        teamId: number,
    ): CancelablePromise<Array<TeamRollupOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/teams/{team_id}/rollups',
            path: {
                'team_id': teamId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Rollup
     * @param teamId
     * @returns TeamRollupDetail Successful Response
     * @throws ApiError
     */
    public static getRollupTeamsTeamIdRollupGet(
        teamId: number,
    ): CancelablePromise<TeamRollupDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/teams/{team_id}/rollup',
            path: {
                'team_id': teamId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run Rollup
     * @param teamId
     * @param forDate YYYY-MM-DD optional date filter
     * @param authorization
     * @returns TeamRollupOut Successful Response
     * @throws ApiError
     */
    public static runRollupTeamsTeamIdRollupRunPost(
        teamId: number,
        forDate?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<TeamRollupOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/teams/{team_id}/rollup/run',
            path: {
                'team_id': teamId,
            },
            headers: {
                'authorization': authorization,
            },
            query: {
                'for_date': forDate,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
