/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Crash Route
     * @returns any Successful Response
     * @throws ApiError
     */
    public static crashRouteCrashRouteGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crash-route',
        });
    }
    /**
     * Options Register
     * @returns any Successful Response
     * @throws ApiError
     */
    public static optionsRegisterApiV1AuthRegisterOptions(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'OPTIONS',
            url: '/api/v1/auth/register',
        });
    }
    /**
     * Health
     * Enhanced health endpoint showing application status and metrics.
     *
     * Checks:
     * - Application uptime and version
     * - Database connectivity
     * - Request metrics summary
     *
     * Returns:
     * - status: Application health status (healthy/degraded/unhealthy)
     * - version: Application version from config
     * - uptime_seconds: Time since application startup
     * - mode: Current environment mode (development/production)
     * - total_requests: Aggregate request count from metrics
     * - database: Database connectivity status
     *
     * This endpoint provides observability into the running application state
     * and is suitable for load balancer health checks.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static healthHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
}
