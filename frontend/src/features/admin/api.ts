import { apiClient } from '../../shared/api/client'
import type {
  ResearchStudyOut,
  ResearchStudyCreate,
  ResearchStudyUpdate,
  TeamOut,
  TeamCreate,
  TeamUpdate,
  TeamMemberOut,
  TeamMemberAdd,
  TeamRollupOut,
} from '../../shared/api/generated'

// --- Teams ---

export async function fetchTeams(): Promise<TeamOut[]> {
  const { data } = await apiClient.get<TeamOut[]>('/teams/')
  return data
}

export async function createTeam(payload: TeamCreate): Promise<TeamOut> {
  const { data } = await apiClient.post<TeamOut>('/teams/', payload)
  return data
}

export async function updateTeam(teamId: number, payload: TeamUpdate): Promise<TeamOut> {
  const { data } = await apiClient.patch<TeamOut>(`/teams/${teamId}`, payload)
  return data
}

export async function addTeamMember(teamId: number, payload: TeamMemberAdd): Promise<TeamMemberOut> {
  const { data } = await apiClient.post<TeamMemberOut>(`/teams/${teamId}/members`, payload)
  return data
}

export async function fetchTeamRollup(teamId: number): Promise<TeamRollupOut> {
  const { data } = await apiClient.get<TeamRollupOut>(`/teams/${teamId}/rollup`)
  return data
}

// --- Research ---

export async function fetchStudies(): Promise<ResearchStudyOut[]> {
  const { data } = await apiClient.get<ResearchStudyOut[]>('/research/studies')
  return data
}

export async function createStudy(payload: ResearchStudyCreate): Promise<ResearchStudyOut> {
  const { data } = await apiClient.post<ResearchStudyOut>('/research/studies', payload)
  return data
}

export async function updateStudy(studyId: number, payload: ResearchStudyUpdate): Promise<ResearchStudyOut> {
  const { data } = await apiClient.patch<ResearchStudyOut>(`/research/studies/${studyId}`, payload)
  return data
}

export async function fetchStudyData(studyId: number): Promise<any> {
  // TODO: Define ResearchStudyDataOut if available
  const { data } = await apiClient.get<any>(`/research/studies/${studyId}/data`)
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

// --- Pipelines ---

export interface AdminPipeline {
  id: number
  version: string
  pipelineCode: string | null
  description: string | null
  isActive: boolean
}

export interface ListPipelinesResponse {
  instrumentCode: string
  pipelines: AdminPipeline[]
}

export async function listPipelines(instrumentCode: string): Promise<ListPipelinesResponse> {
  const { data } = await apiClient.get<ListPipelinesResponse>(`/admin/instruments/${instrumentCode}/pipelines`)
  return data
}

export interface ClonePipelineRequest {
  version: string
  pipelineCode?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export async function clonePipeline(
  instrumentCode: string,
  pipelineId: number,
  payload: ClonePipelineRequest,
  instrumentVersion?: string,
): Promise<AdminPipeline> {
  const { data } = await apiClient.post<AdminPipeline>(
    `/admin/instruments/${instrumentCode}/pipelines/${pipelineId}/clone`,
    payload,
    {
      params: instrumentVersion ? { instrument_version: instrumentVersion } : undefined,
    },
  )
  return data
}
