import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ReflectionType } from '../model'
import { createReflection, fetchReflections, fetchSphereNodes, fetchSpherePrompt } from '../api'

export function useSphere(filterType?: ReflectionType) {
  const queryClient = useQueryClient()

  const nodesQuery = useQuery({
    queryKey: ['sphere-nodes'],
    queryFn: fetchSphereNodes,
  })

  const reflectionsQuery = useQuery({
    queryKey: ['sphere-reflections', filterType],
    queryFn: () => fetchReflections(filterType),
  })

  const promptQuery = useQuery({
    queryKey: ['sphere-prompt'],
    queryFn: fetchSpherePrompt,
  })

  const createReflectionMutation = useMutation({
    mutationFn: createReflection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sphere-reflections'] })
    },
  })

  return {
    nodes: nodesQuery.data ?? [],
    reflections: reflectionsQuery.data ?? [],
    prompt: promptQuery.data?.prompt,
    isLoading: nodesQuery.isLoading || reflectionsQuery.isLoading,
    createReflection: createReflectionMutation.mutateAsync,
    isCreating: createReflectionMutation.isPending,
  }
}
