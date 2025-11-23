export type Role = 'MAHASISWA' | 'MEDIATOR'

export interface Badge {
  slug: string
  name: string
  rarity: string
}

export interface UserAchievement {
  id: number
  awardedAt: string
  badge: Badge
}

export interface User {
  id: number
  fullName: string
  email: string
  role: Role
  nim?: string | null
  kelas?: string | null
  tahunMasuk?: number | null
  avatarUrl?: string | null
  zenPoints?: number | null
  currentLvl?: number | null
  lifeMotto?: string | null
  achievements?: UserAchievement[]
}
