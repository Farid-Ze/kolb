import { apiClient } from '../../shared/api/client'
import type { Reflection, ReflectionCreatePayload, ReflectionType, SphereNode } from './model'

export async function fetchSphereNodes(): Promise<SphereNode[]> {
  const { data } = await apiClient.get<SphereNode[]>('/sphere/nodes')
  return data
}

export async function fetchReflections(type?: ReflectionType): Promise<Reflection[]> {
  const params = type ? { reflection_type: type } : {}
  const { data } = await apiClient.get<Reflection[]>('/sphere/reflections', { params })
  return data
}

export async function createReflection(payload: ReflectionCreatePayload): Promise<Reflection> {
  const { data } = await apiClient.post<Reflection>('/sphere/reflections', payload)
  return data
}

export async function fetchSpherePrompt(): Promise<{ prompt: string }> {
  const { data } = await apiClient.get<{ prompt: string }>('/sphere/prompt')
  return data
}
