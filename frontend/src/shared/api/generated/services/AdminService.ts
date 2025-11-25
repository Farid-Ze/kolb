/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_import_norms_admin_norms_import_post } from '../models/Body_import_norms_admin_norms_import_post';
import type { ClonePipelineRequest } from '../models/ClonePipelineRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Import Norms
     * @param normGroup
     * @param formData
     * @param normVersion
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static importNormsAdminNormsImportPost(
        normGroup: string,
        formData: Body_import_norms_admin_norms_import_post,
        normVersion: string = 'default',
        authorization?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/norms/import',
            headers: {
                'authorization': authorization,
            },
            query: {
                'norm_group': normGroup,
                'norm_version': normVersion,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Norm Cache Stats
     * Return in-process normative DB lookup cache statistics (Mediator only).
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getNormCacheStatsAdminNormsCacheStatsGet(
        authorization?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/norms/cache-stats',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get External Norm Cache Stats
     * Statistik cache penyedia norma eksternal (Mediator only).
     *
     * Mengembalikan hit/miss, ukuran cache, TTL, dan metrik jaringan dasar.
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getExternalNormCacheStatsAdminNormsExternalCacheStatsGet(
        authorization?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/norms/external-cache-stats',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Perf Metrics
     * Return lightweight performance metrics (Mediator only).
     *
     * Includes timing counters and norm provider cache stats.
     * Use `reset=true` to clear counters after reading.
     * @param reset
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getPerfMetricsAdminPerfMetricsGet(
        reset: boolean = false,
        authorization?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/perf-metrics',
            headers: {
                'authorization': authorization,
            },
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
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listInstrumentPipelinesAdminInstrumentsInstrumentCodePipelinesGet(
        instrumentCode: string,
        instrumentVersion?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/instruments/{instrument_code}/pipelines',
            path: {
                'instrument_code': instrumentCode,
            },
            headers: {
                'authorization': authorization,
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
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static activateInstrumentPipelineAdminInstrumentsInstrumentCodePipelinesPipelineIdActivatePost(
        instrumentCode: string,
        pipelineId: number,
        instrumentVersion?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/instruments/{instrument_code}/pipelines/{pipeline_id}/activate',
            path: {
                'instrument_code': instrumentCode,
                'pipeline_id': pipelineId,
            },
            headers: {
                'authorization': authorization,
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
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static cloneInstrumentPipelineAdminInstrumentsInstrumentCodePipelinesPipelineIdClonePost(
        instrumentCode: string,
        pipelineId: number,
        requestBody: ClonePipelineRequest,
        instrumentVersion?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/instruments/{instrument_code}/pipelines/{pipeline_id}/clone',
            path: {
                'instrument_code': instrumentCode,
                'pipeline_id': pipelineId,
            },
            headers: {
                'authorization': authorization,
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
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteInstrumentPipelineAdminInstrumentsInstrumentCodePipelinesPipelineIdDelete(
        instrumentCode: string,
        pipelineId: number,
        instrumentVersion?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/instruments/{instrument_code}/pipelines/{pipeline_id}',
            path: {
                'instrument_code': instrumentCode,
                'pipeline_id': pipelineId,
            },
            headers: {
                'authorization': authorization,
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
