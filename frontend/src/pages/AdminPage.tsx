import { useState } from 'react'

import { PipelinesPanel } from '../features/admin/components/PipelinesPanel'
import { ResearchPanel } from '../features/admin/components/ResearchPanel'
import { TeamsPanel } from '../features/admin/components/TeamsPanel'

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'teams' | 'research' | 'pipelines'>('teams')
  const tabs = ['teams', 'research', 'pipelines'] as const

  return (
    <section className="space-y-8">
      <header>
        <p className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Command Center</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[var(--zen-text)]">Admin Console</h1>
      </header>

      <div className="border-b border-white/10">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 py-4 px-1 font-ui text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-[var(--zen-accent)] text-[var(--zen-accent)]'
                  : 'border-transparent text-[var(--zen-text-muted)] hover:border-white/20 hover:text-[var(--zen-text)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px] rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        {activeTab === 'teams' && <TeamsPanel />}
        {activeTab === 'research' && <ResearchPanel />}
        {activeTab === 'pipelines' && <PipelinesPanel />}
      </div>
    </section>
  )
}
