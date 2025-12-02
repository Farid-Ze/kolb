/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamCreate } from '../models/TeamCreate';
import type { TeamListResponse } from '../models/TeamListResponse';
import type { TeamMemberAdd } from '../models/TeamMemberAdd';
import type { TeamMemberAnalyticsResponse } from '../models/TeamMemberAnalyticsResponse';
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
     * @returns TeamOut Successful Response
     * @throws ApiError
     */
    public static createTeamApiV1TeamsPost(
        requestBody: TeamCreate,
    ): CancelablePromise<TeamOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/teams/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Teams
     * @param page
     * @param size
     * @param q
     * @returns TeamListResponse Successful Response
     * @throws ApiError
     */
    public static listTeamsApiV1TeamsGet(
        page: number = 1,
        size: number = 50,
        q?: string | null,
    ): CancelablePromise<TeamListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams/',
            query: {
                'page': page,
                'size': size,
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
    public static getTeamApiV1TeamsTeamIdGet(
        teamId: number,
    ): CancelablePromise<TeamOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams/{team_id}',
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
     * @returns TeamOut Successful Response
     * @throws ApiError
     */
    public static updateTeamApiV1TeamsTeamIdPatch(
        teamId: number,
        requestBody: TeamUpdate,
    ): CancelablePromise<TeamOut> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/teams/{team_id}',
            path: {
                'team_id': teamId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteTeamApiV1TeamsTeamIdDelete(
        teamId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/teams/{team_id}',
            path: {
                'team_id': teamId,
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
    public static listMembersApiV1TeamsTeamIdMembersGet(
        teamId: number,
    ): CancelablePromise<Array<TeamMemberOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams/{team_id}/members',
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
     * @returns TeamMemberOut Successful Response
     * @throws ApiError
     */
    public static addMemberApiV1TeamsTeamIdMembersPost(
        teamId: number,
        requestBody: TeamMemberAdd,
    ): CancelablePromise<TeamMemberOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/teams/{team_id}/members',
            path: {
                'team_id': teamId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static removeMemberApiV1TeamsTeamIdMembersMemberIdDelete(
        teamId: number,
        memberId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/teams/{team_id}/members/{member_id}',
            path: {
                'team_id': teamId,
                'member_id': memberId,
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
    public static listRollupsApiV1TeamsTeamIdRollupsGet(
        teamId: number,
    ): CancelablePromise<Array<TeamRollupOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams/{team_id}/rollups',
            path: {
                'team_id': teamId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Rollup
     * Create a new rollup snapshot for the team.
     * @param teamId
     * @param forDate YYYY-MM-DD optional date filter
     * @returns TeamRollupOut Successful Response
     * @throws ApiError
     */
    public static createRollupApiV1TeamsTeamIdRollupsPost(
        teamId: number,
        forDate?: string | null,
    ): CancelablePromise<TeamRollupOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/teams/{team_id}/rollups',
            path: {
                'team_id': teamId,
            },
            query: {
                'for_date': forDate,
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
    public static getRollupApiV1TeamsTeamIdRollupGet(
        teamId: number,
    ): CancelablePromise<TeamRollupDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams/{team_id}/rollup',
            path: {
                'team_id': teamId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Rollup Members
     * @param teamId
     * @param page
     * @param size
     * @returns TeamMemberAnalyticsResponse Successful Response
     * @throws ApiError
     */
    public static getRollupMembersApiV1TeamsTeamIdAnalyticsMembersGet(
        teamId: number,
        page: number = 1,
        size: number = 50,
    ): CancelablePromise<TeamMemberAnalyticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams/{team_id}/analytics/members',
            path: {
                'team_id': teamId,
            },
            query: {
                'page': page,
                'size': size,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * @deprecated
     * Run Rollup
     * @param teamId
     * @param forDate YYYY-MM-DD optional date filter
     * @returns TeamRollupOut Successful Response
     * @throws ApiError
     */
    public static runRollupApiV1TeamsTeamIdRollupRunPost(
        teamId: number,
        forDate?: string | null,
    ): CancelablePromise<TeamRollupOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/teams/{team_id}/rollup/run',
            path: {
                'team_id': teamId,
            },
            query: {
                'for_date': forDate,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Team
     * @param requestBody
     * @returns TeamOut Successful Response
     * @throws ApiError
     */
    public static createTeamTeamsPost(
        requestBody: TeamCreate,
    ): CancelablePromise<TeamOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/teams/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Teams
     * @param page
     * @param size
     * @param q
     * @returns TeamListResponse Successful Response
     * @throws ApiError
     */
    public static listTeamsTeamsGet(
        page: number = 1,
        size: number = 50,
        q?: string | null,
    ): CancelablePromise<TeamListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/teams/',
            query: {
                'page': page,
                'size': size,
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
     * @returns TeamOut Successful Response
     * @throws ApiError
     */
    public static updateTeamTeamsTeamIdPatch(
        teamId: number,
        requestBody: TeamUpdate,
    ): CancelablePromise<TeamOut> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/teams/{team_id}',
            path: {
                'team_id': teamId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteTeamTeamsTeamIdDelete(
        teamId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
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
     * @returns TeamMemberOut Successful Response
     * @throws ApiError
     */
    public static addMemberTeamsTeamIdMembersPost(
        teamId: number,
        requestBody: TeamMemberAdd,
    ): CancelablePromise<TeamMemberOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/teams/{team_id}/members',
            path: {
                'team_id': teamId,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static removeMemberTeamsTeamIdMembersMemberIdDelete(
        teamId: number,
        memberId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/teams/{team_id}/members/{member_id}',
            path: {
                'team_id': teamId,
                'member_id': memberId,
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
     * Create Rollup
     * Create a new rollup snapshot for the team.
     * @param teamId
     * @param forDate YYYY-MM-DD optional date filter
     * @returns TeamRollupOut Successful Response
     * @throws ApiError
     */
    public static createRollupTeamsTeamIdRollupsPost(
        teamId: number,
        forDate?: string | null,
    ): CancelablePromise<TeamRollupOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/teams/{team_id}/rollups',
            path: {
                'team_id': teamId,
            },
            query: {
                'for_date': forDate,
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
     * Get Rollup Members
     * @param teamId
     * @param page
     * @param size
     * @returns TeamMemberAnalyticsResponse Successful Response
     * @throws ApiError
     */
    public static getRollupMembersTeamsTeamIdAnalyticsMembersGet(
        teamId: number,
        page: number = 1,
        size: number = 50,
    ): CancelablePromise<TeamMemberAnalyticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/teams/{team_id}/analytics/members',
            path: {
                'team_id': teamId,
            },
            query: {
                'page': page,
                'size': size,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * @deprecated
     * Run Rollup
     * @param teamId
     * @param forDate YYYY-MM-DD optional date filter
     * @returns TeamRollupOut Successful Response
     * @throws ApiError
     */
    public static runRollupTeamsTeamIdRollupRunPost(
        teamId: number,
        forDate?: string | null,
    ): CancelablePromise<TeamRollupOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/teams/{team_id}/rollup/run',
            path: {
                'team_id': teamId,
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
