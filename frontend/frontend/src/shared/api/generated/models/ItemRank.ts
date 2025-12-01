/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ItemChoiceRank } from './ItemChoiceRank';
export type ItemRank = {
    itemId: number;
    /**
     * List of 4 ranked choices. Must be unique ranks 1-4.
     */
    ranks: Array<ItemChoiceRank>;
};

