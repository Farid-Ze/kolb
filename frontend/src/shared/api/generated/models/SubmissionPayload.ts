/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SubmissionPayload = {
    kind: SubmissionPayload.kind;
    itemId?: (number | null);
    ranks?: (Record<string, number> | null);
    contextName?: (string | null);
    CE?: (number | null);
    RO?: (number | null);
    AC?: (number | null);
    AE?: (number | null);
};
export namespace SubmissionPayload {
    export enum kind {
        ITEM = 'item',
        CONTEXT = 'context',
    }
}

