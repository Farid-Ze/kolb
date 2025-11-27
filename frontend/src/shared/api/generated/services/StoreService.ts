/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckoutRequest } from '../models/CheckoutRequest';
import type { CommunityFundSummary } from '../models/CommunityFundSummary';
import type { ProductOut } from '../models/ProductOut';
import type { StoreOrderOut } from '../models/StoreOrderOut';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StoreService {
    /**
     * List Products
     * @param authorization
     * @returns ProductOut Successful Response
     * @throws ApiError
     */
    public static listProductsStoreProductsGet(
        authorization?: (string | null),
    ): CancelablePromise<Array<ProductOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/store/products',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Product
     * @param productId
     * @param authorization
     * @returns ProductOut Successful Response
     * @throws ApiError
     */
    public static getProductStoreProductsProductIdGet(
        productId: number,
        authorization?: (string | null),
    ): CancelablePromise<ProductOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/store/products/{product_id}',
            path: {
                'product_id': productId,
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
     * Checkout
     * @param requestBody
     * @param authorization
     * @returns StoreOrderOut Successful Response
     * @throws ApiError
     */
    public static checkoutStoreCheckoutPost(
        requestBody: CheckoutRequest,
        authorization?: (string | null),
    ): CancelablePromise<StoreOrderOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/store/checkout',
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
     * Community Fund
     * @returns CommunityFundSummary Successful Response
     * @throws ApiError
     */
    public static communityFundStoreCommunityFundGet(): CancelablePromise<CommunityFundSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/store/community-fund',
        });
    }
}
