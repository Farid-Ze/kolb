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
  user_id: string;
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
  user_id: string;
  name: string;
  email: string;
  ac_ce: number; // X-axis: Abstract-Concrete
  ae_ro: number; // Y-axis: Active-Reflective
  learning_style: string;
  style_code: string;
  session_id: number;
  generated_at: string;
}

export interface TeamRollupBalanceMetrics {
  CE_percentage: number;
  RO_percentage: number;
  AC_percentage: number;
  AE_percentage: number;
}

export interface TeamRollupLegacyMember {
  user_id: string;
  name: string;
  email?: string;
  learning_style?: string;
  style_code?: string;
  AC_CE?: number;
  AE_RO?: number;
  ac_ce?: number;
  ae_ro?: number;
  session_id?: number;
  generated_at?: string;
}

export interface TeamRollup {
  team_id: number;
  team_name: string;
  data_points?: TeamRollupDataPoint[];
  members?: TeamRollupLegacyMember[];
  member_count?: number;
  summary?: {
    total_members: number;
    members_with_data: number;
    avg_ac_ce: number;
    avg_ae_ro: number;
    style_distribution: Record<string, number>;
  };
  diversity_score?: number;
  balance_metrics?: TeamRollupBalanceMetrics;
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
  userId: string
): Promise<{ ok: boolean; message: string }> => {
  return authenticatedApiCall<{ ok: boolean; message: string }>(
    getApiUrl(`teams/${teamId}/members/${userId}`),
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

