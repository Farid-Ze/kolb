import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Users } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../../../shared/ui/Button'
import { createTeam, fetchTeams } from '../api'

export function TeamsPanel() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams', page, pageSize],
    queryFn: () => fetchTeams(page, pageSize),
  })

  const createMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setIsCreating(false)
      setNewTeamName('')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return
    createMutation.mutate({ name: newTeamName })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-[var(--zen-text)]">Team Management</h2>
          <p className="text-sm text-[var(--zen-text-muted)]">Manage student groups and facilitators.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Team
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team Name"
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
        <p className="text-sm text-[var(--zen-text-muted)]">Loading teams...</p>
      ) : teamsData?.items.length === 0 ? (
        <p className="text-sm text-[var(--zen-text-muted)]">No teams found.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamsData?.items.map((team) => (
              <div key={team.id} className="rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--zen-text)]">{team.name}</h3>
                    <p className="text-xs text-[var(--zen-text-muted)]">{team.kelas || 'No Class'}</p>
                  </div>
                </div>
                {team.description && <p className="mt-3 text-sm text-[var(--zen-text-muted)]">{team.description}</p>}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {teamsData && teamsData.pages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--zen-border)] pt-4">
              <p className="text-sm text-[var(--zen-text-muted)]">
                Page {teamsData.page} of {teamsData.pages} ({teamsData.total} teams)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(teamsData.pages, p + 1))}
                  disabled={page === teamsData.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
