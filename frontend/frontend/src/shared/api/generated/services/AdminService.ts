/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClonePipelineRequest } from '../models/ClonePipelineRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Get Norm Cache Stats
     * Return in-process normative DB lookup cache statistics (Mediator only).
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getNormCacheStatsApiV1AdminNormsCacheStatsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/norms/cache-stats',
        });
    }
    /**
     * Get External Norm Cache Stats
     * Statistik cache penyedia norma eksternal (Mediator only).
     *
     * Mengembalikan hit/miss, ukuran cache, TTL, dan metrik jaringan dasar.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getExternalNormCacheStatsApiV1AdminNormsExternalCacheStatsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/norms/external-cache-stats',
        });
    }
    /**
     * Get Perf Metrics
     * Return lightweight performance metrics (Mediator only).
     *
     * Includes timing counters and norm provider cache stats.
     * Use `reset=true` to clear counters after reading.
     * @param reset
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getPerfMetricsApiV1AdminPerfMetricsGet(
        reset: boolean = false,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/perf-metrics',
            query: {
                'reset': reset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Instrument Pipelines
     * @param instrumentCode
     * @param instrumentVersion
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listInstrumentPipelinesApiV1AdminInstrumentsInstrumentCodePipelinesGet(
        instrumentCode: string,
        instrumentVersion?: string | null,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/instruments/{instrument_code}/pipelines',
            path: {
                'instrument_code': instrumentCode,
            },
            query: {
                'instrument_version': instrumentVersion,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Activate Instrument Pipeline
     * @param instrumentCode
     * @param pipelineId
     * @param instrumentVersion
     * @returns any Successful Response
     * @throws ApiError
     */
    public static activateInstrumentPipelineApiV1AdminInstrumentsInstrumentCodePipelinesPipelineIdActivatePost(
        instrumentCode: string,
        pipelineId: number,
        instrumentVersion?: string | null,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/instruments/{instrument_code}/pipelines/{pipeline_id}/activate',
            path: {
                'instrument_code': instrumentCode,
                'pipeline_id': pipelineId,
            },
            query: {
                'instrument_version': instrumentVersion,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clone Instrument Pipeline
     * @param instrumentCode
     * @param pipelineId
     * @param requestBody
     * @param instrumentVersion
     * @returns any Successful Response
     * @throws ApiError
     */
    public static cloneInstrumentPipelineApiV1AdminInstrumentsInstrumentCodePipelinesPipelineIdClonePost(
        instrumentCode: string,
        pipelineId: number,
        requestBody: ClonePipelineRequest,
        instrumentVersion?: string | null,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/instruments/{instrument_code}/pipelines/{pipeline_id}/clone',
            path: {
                'instrument_code': instrumentCode,
                'pipeline_id': pipelineId,
            },
            query: {
                'instrument_version': instrumentVersion,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Instrument Pipeline
     * @param instrumentCode
     * @param pipelineId
     * @param instrumentVersion
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteInstrumentPipelineApiV1AdminInstrumentsInstrumentCodePipelinesPipelineIdDelete(
        instrumentCode: string,
        pipelineId: number,
        instrumentVersion?: string | null,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/instruments/{instrument_code}/pipelines/{pipeline_id}',
            path: {
                'instrument_code': instrumentCode,
                'pipeline_id': pipelineId,
            },
            query: {
                'instrument_version': instrumentVersion,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
