export type ChallengeStatus = 'Active' | 'Completed'

export interface UserChallenge {
  id: number
  challengeId: number
  status: ChallengeStatus
  proofUrl?: string | null
  createdAt: string
  completedAt?: string | null
}
