import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/hooks/useAuth'

export function AdminPage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'teams' | 'research' | 'pipelines'>('teams')

  if (isLoading) return null
  if (!user || user.role !== 'MEDIATOR') {
    return <Navigate to="/" replace />
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">Command Center</p>
        <h1 className="text-2xl font-semibold">Admin Console</h1>
      </header>

      <div className="border-b border-[var(--zen-border)]">
        <nav className="-mb-px flex space-x-8">
          {['teams', 'research', 'pipelines'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === tab
                  ? 'border-[var(--zen-accent)] text-[var(--zen-accent)]'
                  : 'border-transparent text-[var(--zen-text-muted)] hover:border-[var(--zen-border)] hover:text-[var(--zen-text)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px] rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-6">
        {activeTab === 'teams' && (
          <div>
            <h2 className="text-lg font-medium">Team Management</h2>
            <p className="text-[var(--zen-text-muted)]">Manage student groups and facilitators.</p>
            {/* TODO: List teams */}
          </div>
        )}
        {activeTab === 'research' && (
          <div>
            <h2 className="text-lg font-medium">Research Studies</h2>
            <p className="text-[var(--zen-text-muted)]">Configure active studies and consent forms.</p>
            {/* TODO: List studies */}
          </div>
        )}
        {activeTab === 'pipelines' && (
          <div>
            <h2 className="text-lg font-medium">Scoring Pipelines</h2>
            <p className="text-[var(--zen-text-muted)]">Monitor and trigger scoring jobs.</p>
            {/* TODO: Pipeline controls */}
          </div>
        )}
      </div>
    </section>
  )
}
