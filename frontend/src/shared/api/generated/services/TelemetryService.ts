/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReplayEventBatch } from '../models/ReplayEventBatch';
import type { TelemetryBatch } from '../models/TelemetryBatch';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TelemetryService {
    /**
     * Batch Telemetry
     * Accept batched telemetry events for async processing.
     *
     * **Scalability Benefits:**
     * - Reduces request volume by 90%+ through client-side batching
     * - Uses Beacon API for fire-and-forget delivery
     * - Processes events asynchronously (non-blocking)
     * - Handles up to 1000 events per batch
     *
     * **Usage:**
     * ```javascript
     * const batch = {
         * session_id: "abc123",
         * events: [
             * {type: "mouse", timestamp_ms: 1234567890, payload: {x: 100, y: 200}},
             * {type: "scroll", timestamp_ms: 1234567891, payload: {scrollY: 500}}
             * ]
             * };
             *
             * // Using Beacon API (recommended)
             * navigator.sendBeacon('/telemetry/batch', JSON.stringify(batch));
             *
             * // Or fetch with keepalive
             * fetch('/telemetry/batch', {
                 * method: 'POST',
                 * headers: {'Content-Type': 'application/json'},
                 * body: JSON.stringify(batch),
                 * keepalive: true
                 * });
                 * ```
                 *
                 * **Returns:** 202 Accepted (processing in background)
                 * @param contentLength
                 * @param requestBody
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public static batchTelemetryTelemetryBatchPost(
                    contentLength: number,
                    requestBody: TelemetryBatch,
                ): CancelablePromise<any> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/telemetry/batch',
                        headers: {
                            'Content-Length': contentLength,
                        },
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Record Replay Events
                 * Record session replay events for debugging.
                 *
                 * Stores events in a JSONL file for later playback/analysis.
                 * @param requestBody
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public static recordReplayEventsTelemetryReplayEventsPost(
                    requestBody: ReplayEventBatch,
                ): CancelablePromise<any> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/telemetry/replay-events',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
            }
