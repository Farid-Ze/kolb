import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../../../shared/ui/Button'
import { createStudy, fetchStudies } from '../api'

export function ResearchPanel() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newStudyTitle, setNewStudyTitle] = useState('')

  const { data: studies, isLoading } = useQuery({
    queryKey: ['studies'],
    queryFn: fetchStudies,
  })

  const createMutation = useMutation({
    mutationFn: createStudy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studies'] })
      setIsCreating(false)
      setNewStudyTitle('')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudyTitle.trim()) return
    createMutation.mutate({ title: newStudyTitle })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-[var(--zen-text)]">Research Studies</h2>
          <p className="text-sm text-[var(--zen-text-muted)]">Configure active studies and consent forms.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Study
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={newStudyTitle}
              onChange={(e) => setNewStudyTitle(e.target.value)}
              placeholder="Study Title"
              className="flex-1 rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] px-3 py-2 text-sm"
              autoFocus
            />
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-[var(--zen-text-muted)]">Loading studies...</p>
      ) : studies?.length === 0 ? (
        <p className="text-sm text-[var(--zen-text-muted)]">No studies found.</p>
      ) : (
        <div className="space-y-4">
          {studies?.map((study) => (
            <div key={study.publicId} className="flex items-center justify-between rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--zen-text)]">{study.title}</h3>
                  <p className="text-xs text-[var(--zen-text-muted)]">
                    {study.startedAt ? `Started: ${new Date(study.startedAt).toLocaleDateString()}` : 'Not started'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${study.completedAt ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                  {study.completedAt ? 'Completed' : 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
