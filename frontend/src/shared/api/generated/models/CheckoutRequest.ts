/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CartItem } from './CartItem';
export type CheckoutRequest = {
    items?: (Array<CartItem> | null);
    productId?: (number | null);
    quantity?: number;
    contributionPoints?: number;
};

