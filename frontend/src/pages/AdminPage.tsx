import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/hooks/useAuth'
import { PipelinesPanel } from '../features/admin/components/PipelinesPanel'
import { ResearchPanel } from '../features/admin/components/ResearchPanel'
import { TeamsPanel } from '../features/admin/components/TeamsPanel'

export function AdminPage() {
  const { token, isMediator, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'teams' | 'research' | 'pipelines'>('teams')
  const tabs = ['teams', 'research', 'pipelines'] as const

  if (!token && !isLoading) {
    return <Navigate to="/login" replace />
  }

  if (token && !isMediator) {
    return <Navigate to="/" replace />
  }

  if (isLoading) return null

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">Command Center</p>
        <h1 className="text-2xl font-semibold">Admin Console</h1>
      </header>

      <div className="border-b border-[var(--zen-border)]">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
