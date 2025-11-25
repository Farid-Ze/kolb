/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StoreOrderItemOut } from './StoreOrderItemOut';
export type StoreOrderOut = {
    id: string;
    totalAmount: number;
    contributionPoints?: number;
    paymentStatus: string;
    snapToken?: (string | null);
    createdAt: string;
    items?: Array<StoreOrderItemOut>;
    remainingPoints?: (number | null);
};

