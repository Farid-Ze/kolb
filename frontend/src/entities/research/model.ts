export interface ResearchStudy {
  id: number
  title: string
  description?: string | null
  startedAt?: string | null
  completedAt?: string | null
  notes?: string | null
}

export interface ResearchStudyCreatePayload {
  title: string
  description?: string | null
  startedAt?: string | null
  completedAt?: string | null
  notes?: string | null
}

export interface ResearchStudyUpdatePayload {
  title?: string | null
  description?: string | null
  startedAt?: string | null
  completedAt?: string | null
  notes?: string | null
}

export interface StudyDataPoint {
  sessionId: number
  userId: number
  userEmail: string
  userName: string
  generatedAt: string
  ceScore: number
  roScore: number
  acScore: number
  aeScore: number
  acCe: number
  aeRo: number
  learningStyle?: string | null
  styleCode?: string | null
  normGroup?: string | null
  assessmentDurationSeconds?: number | null
}

export interface StudyDataSummary {
  totalSessions: number
  uniqueParticipants: number
  dateRange?: {
    earliest: string
    latest: string
  } | null
  styleDistribution: Record<string, number>
}

export interface ResearchStudyData {
  studyId: number
  studyTitle: string
  filtersApplied: Record<string, unknown>
  dataPoints: StudyDataPoint[]
  summary: StudyDataSummary
}
