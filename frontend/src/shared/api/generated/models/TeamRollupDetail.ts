/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamRollupBalanceMetricsOut } from './TeamRollupBalanceMetricsOut';
import type { TeamRollupLegacyMemberOut } from './TeamRollupLegacyMemberOut';
import type { TeamRollupMemberOut } from './TeamRollupMemberOut';
import type { TeamRollupSummaryOut } from './TeamRollupSummaryOut';
export type TeamRollupDetail = {
    teamId: number;
    teamName: string;
    memberCount: number;
    dataPoints: Array<TeamRollupMemberOut>;
    members: Array<TeamRollupMemberOut>;
    legacyMembers: Array<TeamRollupLegacyMemberOut>;
    summary: TeamRollupSummaryOut;
    diversityScore: (number | null);
    balanceMetrics: TeamRollupBalanceMetricsOut;
};

