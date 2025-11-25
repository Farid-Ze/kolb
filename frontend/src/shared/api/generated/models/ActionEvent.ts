/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ActionEvent = {
    actionType: string;
    actionTarget: string;
    actionValue?: (string | null);
    metadata?: (Record<string, string> | null);
    consent?: boolean;
    actorRole?: ActionEvent.actorRole;
};
export namespace ActionEvent {
    export enum actorRole {
        STUDENT = 'STUDENT',
        MEDIATOR = 'MEDIATOR',
        ADMIN = 'ADMIN',
        ANON = 'ANON',
    }
}

