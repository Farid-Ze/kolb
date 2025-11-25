/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GuideOpenEvent = {
    guideId: string;
    language?: (string | null);
    surface?: GuideOpenEvent.surface;
    context?: (string | null);
    metadata?: (Record<string, string> | null);
    consent?: boolean;
};
export namespace GuideOpenEvent {
    export enum surface {
        MODAL = 'modal',
        TOOLTIP = 'tooltip',
        DRAWER = 'drawer',
        LINK = 'link',
    }
}

