import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/hooks/useAuth'
import { PipelinesPanel } from '../features/admin/components/PipelinesPanel'
import { ResearchPanel } from '../features/admin/components/ResearchPanel'
import { TeamsPanel } from '../features/admin/components/TeamsPanel'

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
        {activeTab === 'teams' && <TeamsPanel />}
        {activeTab === 'research' && <ResearchPanel />}
        {activeTab === 'pipelines' && <PipelinesPanel />}
      </div>
    </section>
  )
}
