/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChallengeStatus } from './ChallengeStatus';
export type UserChallengeOut = {
    id: number;
    challengeId: number;
    status: ChallengeStatus;
    proofUrl?: (string | null);
    createdAt: string;
    completedAt?: (string | null);
};

