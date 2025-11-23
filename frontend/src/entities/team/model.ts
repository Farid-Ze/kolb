export interface Team {
  id: number
  name: string
  kelas?: string | null
  description?: string | null
}

export interface TeamCreatePayload {
  name: string
  kelas?: string | null
  description?: string | null
}

export interface TeamUpdatePayload {
  name?: string | null
  kelas?: string | null
  description?: string | null
}

export interface TeamMember {
  id: number
  teamId: number
  userId: number
  roleInTeam?: string | null
}

export interface TeamMemberAddPayload {
  userId: number
  roleInTeam?: string | null
}

export interface TeamRollup {
  id: number
  teamId: number
  date: string
  totalSessions: number
  avgLfi?: number | null
  styleCounts?: Record<string, number> | null
}
