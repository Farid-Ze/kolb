/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionEvent } from '../models/ActionEvent';
import type { AssessmentTelemetryPayload } from '../models/AssessmentTelemetryPayload';
import type { GuideOpenEvent } from '../models/GuideOpenEvent';
import type { ItemChangedEvent } from '../models/ItemChangedEvent';
import type { MouseMovementEvent } from '../models/MouseMovementEvent';
import type { PageViewEvent } from '../models/PageViewEvent';
import type { TimeOnPageEvent } from '../models/TimeOnPageEvent';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TelemetryService {
    /**
     * Record Time On Page
     * Record duration spent on a page.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static recordTimeOnPageTelemetryTimeOnPagePost(
        requestBody: TimeOnPageEvent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/telemetry/time-on-page',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Record Item Changed
     * Record when a user changes their answer.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static recordItemChangedTelemetryItemChangedPost(
        requestBody: ItemChangedEvent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/telemetry/item-changed',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Record Mouse Movement
     * Record mouse movement (sampled).
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static recordMouseMovementTelemetryMouseMovementPost(
        requestBody: MouseMovementEvent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/telemetry/mouse-movement',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Record Guide Open
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static recordGuideOpenTelemetryGuideOpenPost(
        requestBody: GuideOpenEvent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/telemetry/guide-open',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Record Page View
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static recordPageViewTelemetryPageViewPost(
        requestBody: PageViewEvent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/telemetry/page-view',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Record Action
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static recordActionTelemetryActionPost(
        requestBody: ActionEvent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/telemetry/action',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Record Assessment Telemetry
     * @param requestBody
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static recordAssessmentTelemetryTelemetryAssessmentPost(
        requestBody: AssessmentTelemetryPayload,
        authorization?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/telemetry/assessment',
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
