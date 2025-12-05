import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { PipelinesPanel } from '../features/admin/components/PipelinesPanel'
import { ResearchPanel } from '../features/admin/components/ResearchPanel'
import { TeamsPanel } from '../features/admin/components/TeamsPanel'

const tabs = [
  { key: 'teams', label: 'Teams', icon: '◇' },
  { key: 'research', label: 'Research', icon: '◈' },
  { key: 'pipelines', label: 'Pipelines', icon: '◆' },
] as const

type TabKey = (typeof tabs)[number]['key']

/**
 * AWWWARDS-LEVEL ADMIN PAGE
 * 
 * Design Principles:
 * - Premium pill tab navigation (like AuthPage)
 * - Staggered entrance animations
 * - Glass morphism panels
 * - GPU-optimized transitions
 * - Consistent with Citrix design language
 */

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('teams')

  return (
    <motion.section 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {/* Header with stagger animation */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const }}
      >
        <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Command Center
        </p>
        <h1 className="mt-2 font-headline text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em]">
          Admin Console
        </h1>
      </motion.header>

      {/* Tab Switcher - Premium pill design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
      >
        <div 
          className="inline-flex rounded-full border border-white/[0.08] bg-black/30 backdrop-blur-xl p-1"
          role="tablist"
          aria-label="Admin sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`${tab.key}-panel`}
              id={`${tab.key}-tab`}
              className={`relative rounded-full px-5 py-2.5 font-ui text-[11px] uppercase tracking-[0.1em] font-semibold gpu-transition ${
                activeTab === tab.key 
                  ? 'text-white' 
                  : 'text-gray-500 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {/* Active indicator - animated pill */}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="admin-tab-indicator"
                  className="absolute inset-0 rounded-full bg-blue-600 shadow-lg shadow-blue-500/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-[8px]">{tab.icon}</span>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content Panel with glass morphism */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      >
        {/* Ambient glow */}
        <div 
          className="absolute -inset-4 bg-blue-500/5 blur-[60px] rounded-3xl pointer-events-none"
          aria-hidden="true"
        />
        
        <div className="relative min-h-[400px] rounded-2xl border border-white/[0.06] bg-[#0c0c14]/80 backdrop-blur-xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
              role="tabpanel"
              id={`${activeTab}-panel`}
              aria-labelledby={`${activeTab}-tab`}
            >
              {activeTab === 'teams' && <TeamsPanel />}
              {activeTab === 'research' && <ResearchPanel />}
              {activeTab === 'pipelines' && <PipelinesPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.section>
  )
}
