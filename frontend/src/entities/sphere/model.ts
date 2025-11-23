export type ReflectionType = 'Thinking' | 'Feeling' | 'Acting' | 'Watching'

export type SphereNode = {
  id: number
  posX: number
  posY: number
  posZ: number
  unlockDate: string
  meta?: Record<string, unknown> | null
}

export type Reflection = {
  id: number
  content: string
  reflectionType: ReflectionType
  createdAt: string
  sphereNodeId?: number | null
}

export type ReflectionCreatePayload = {
  sphereNodeId?: number | null
  content: string
  reflectionType: ReflectionType
}
