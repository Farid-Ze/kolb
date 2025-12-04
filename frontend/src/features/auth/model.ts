export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  nim?: string | null
  kelas?: string | null
  tahunMasuk?: number | null
}
