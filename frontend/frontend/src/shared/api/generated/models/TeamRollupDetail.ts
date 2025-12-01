/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamRollupBalanceMetricsOut } from './TeamRollupBalanceMetricsOut';
import type { TeamRollupSummaryOut } from './TeamRollupSummaryOut';
export type TeamRollupDetail = {
    teamId: number;
    teamName: string;
    memberCount: number;
    summary: TeamRollupSummaryOut;
    diversityScore: number | null;
    balanceMetrics: TeamRollupBalanceMetricsOut;
};

