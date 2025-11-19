/**
 * KLSI 4.0 - TeamService
 * Task 51, 54, 56, 58-61: Team management dengan authenticatedApiCall
 * 
 * Service layer untuk team management (Mediator Flow)
 * Menggunakan authenticatedApiCall untuk automatic token injection
 */

import { getApiUrl } from '../config/api';
import { authenticatedApiCall } from '../utils/apiHelper';

// Types
export interface Team {
  id: number;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  member_count: number;
}

export interface TeamMember {
  user_id: number;
  email: string;
  name: string;
  joined_at: string;
  latest_session_id?: number;
  learning_style?: string;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
}

export interface TeamRollupDataPoint {
  user_id: number;
  name: string;
  email?: string;
  session_id?: number;
  generated_at?: string;
  ac_ce?: number;
  ae_ro?: number;
  learning_style?: string;
  style_code?: string;
  raw_scores?: {
    CE?: number;
    RO?: number;
    AC?: number;
    AE?: number;
  };
  dialectic_scores?: {
    ACCE?: number;
    AERO?: number;
  };
}

export interface TeamRollupBalanceMetrics {
  CE_percentage: number;
  RO_percentage: number;
  AC_percentage: number;
  AE_percentage: number;
}

export type TeamRollupLegacyMemberStatus = 'missing_data' | 'partial' | 'stale';

export interface TeamRollupLegacyMember {
  user_id: number | string;
  name: string;
  email?: string | null;
  role_in_team?: string | null;
  joined_at?: string | null;
  status?: TeamRollupLegacyMemberStatus;
  status_reason?: string | null;
  learning_style?: string | null;
  style_code?: string | null;
  AC_CE?: number | null;
  AE_RO?: number | null;
  ac_ce?: number | null;
  ae_ro?: number | null;
  session_id?: number | null;
  generated_at?: string | null;
}

export interface TeamRollupSummary {
  total_members: number;
  members_with_data: number;
  avg_ac_ce: number;
  avg_ae_ro: number;
  style_distribution: Record<string, number>;
}

export interface TeamRollup {
  team_id: number;
  team_name: string;
  member_count: number;
  data_points: TeamRollupDataPoint[];
  members: TeamRollupDataPoint[];
  legacy_members?: TeamRollupLegacyMember[];
  summary: TeamRollupSummary;
  diversity_score?: number | null;
  balance_metrics: TeamRollupBalanceMetrics;
}

/**
 * Get all teams for current user (mediator)
 * GET /teams/
 * Task 51
 */
export const getTeams = async (): Promise<Team[]> => {
  return authenticatedApiCall<Team[]>(getApiUrl('teams/'), {
    method: 'GET',
  });
};

/**
 * Create new team
 * POST /teams/
 * Task 54
 */
export const createTeam = async (data: {
  name: string;
  description: string;
}): Promise<Team> => {
  return authenticatedApiCall<Team>(getApiUrl('teams/'), {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Get team details with members
 * GET /teams/:id
 * Task 56
 */
export const getTeamDetails = async (teamId: number): Promise<TeamDetail> => {
  return authenticatedApiCall<TeamDetail>(getApiUrl(`teams/${teamId}`), {
    method: 'GET',
  });
};

/**
 * Add member to team
 * POST /teams/:id/members
 * Task 58
 */
export const addMemberToTeam = async (
  teamId: number,
  data: {
    user_email: string;
  }
): Promise<{ ok: boolean; message: string }> => {
  return authenticatedApiCall<{ ok: boolean; message: string }>(
    getApiUrl(`teams/${teamId}/members`),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};

/**
 * Remove member from team
 * DELETE /teams/:id/members/:userId
 * Task 59
 */
export const removeMemberFromTeam = async (
  teamId: number,
  userId: number | string
): Promise<{ ok: boolean; message: string }> => {
  return authenticatedApiCall<{ ok: boolean; message: string }>(
    getApiUrl(`teams/${teamId}/members/${String(userId)}`),
    {
      method: 'DELETE',
    }
  );
};

/**
 * Get team rollup (aggregate learning style data)
 * GET /teams/:id/rollup
 * Task 61
 */
export const getTeamRollup = async (teamId: number): Promise<TeamRollup> => {
  return authenticatedApiCall<TeamRollup>(getApiUrl(`teams/${teamId}/rollup`), {
    method: 'GET',
  });
};

