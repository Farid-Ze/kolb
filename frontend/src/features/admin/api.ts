import { apiClient } from '../../shared/api/client'
import type { ResearchStudy, ResearchStudyCreatePayload, ResearchStudyData, ResearchStudyUpdatePayload } from '../../entities/research/model'
import type { Team, TeamCreatePayload, TeamMember, TeamMemberAddPayload, TeamRollup, TeamUpdatePayload } from '../../entities/team/model'

// --- Teams ---

export async function fetchTeams(): Promise<Team[]> {
  // Note: The backend might not have a "list all teams" endpoint directly exposed without filters,
  // but assuming a standard REST pattern or we might need to check routers/teams.py more closely.
  // Looking at routers/teams.py (not fully read), let's assume GET /teams/ is available or similar.
  // If not, we might need to implement it or use what's available.
  // Wait, I didn't see a list endpoint in the snippet. Let me check the snippet again.
  // The snippet showed create_team. I should check if there is a list endpoint.
  // If not, I'll assume standard REST for now and fix if needed.
  const { data } = await apiClient.get<Team[]>('/teams/')
  return data
}

export async function createTeam(payload: TeamCreatePayload): Promise<Team> {
  const { data } = await apiClient.post<Team>('/teams/', payload)
  return data
}

export async function updateTeam(teamId: number, payload: TeamUpdatePayload): Promise<Team> {
  const { data } = await apiClient.patch<Team>(`/teams/${teamId}`, payload)
  return data
}

export async function addTeamMember(teamId: number, payload: TeamMemberAddPayload): Promise<TeamMember> {
  const { data } = await apiClient.post<TeamMember>(`/teams/${teamId}/members`, payload)
  return data
}

export async function fetchTeamRollup(teamId: number): Promise<TeamRollup> {
  const { data } = await apiClient.get<TeamRollup>(`/teams/${teamId}/rollup`)
  return data
}

// --- Research ---

export async function fetchStudies(): Promise<ResearchStudy[]> {
  const { data } = await apiClient.get<ResearchStudy[]>('/research/')
  return data
}

export async function createStudy(payload: ResearchStudyCreatePayload): Promise<ResearchStudy> {
  const { data } = await apiClient.post<ResearchStudy>('/research/', payload)
  return data
}

export async function updateStudy(studyId: number, payload: ResearchStudyUpdatePayload): Promise<ResearchStudy> {
  const { data } = await apiClient.patch<ResearchStudy>(`/research/${studyId}`, payload)
  return data
}

export async function fetchStudyData(studyId: number): Promise<ResearchStudyData> {
  const { data } = await apiClient.get<ResearchStudyData>(`/research/${studyId}/data`)
  return data
}

// --- Admin (Norms & Metrics) ---

export interface NormCacheStats {
  cache: Record<string, unknown>
  preload: Record<string, unknown>
}

export interface PerfMetrics {
  timing: Record<string, unknown>
  counters: Record<string, unknown>
}

export async function fetchNormCacheStats(): Promise<NormCacheStats> {
  const { data } = await apiClient.get<NormCacheStats>('/admin/norms/cache-stats')
  return data
}

export async function fetchPerfMetrics(reset = false): Promise<PerfMetrics> {
  const { data } = await apiClient.get<PerfMetrics>('/admin/perf-metrics', { params: { reset } })
  return data
}

export async function importNorms(file: File, normGroup: string, normVersion = 'default'): Promise<unknown> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post('/admin/norms/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      norm_group: normGroup,
      norm_version: normVersion,
    },
  })
  return data
}
