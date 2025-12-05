import { memo } from 'react'
import { useAuth } from '../features/auth/hooks/useAuth'
import { SkeletonPage } from '../shared/ui/Skeleton'
import { AnimatedNumber } from '../shared/ui/AnimatedNumber'

// SVG icons as inline components for premium feel
const StarIcon = memo(function StarIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
})

const TrophyIcon = memo(function TrophyIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
})

const SparklesIcon = memo(function SparklesIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
})

export const ProfilePage = memo(function ProfilePage() {
  const { user } = useAuth()

  // Premium skeleton loading state
  if (!user) {
    return <SkeletonPage />
  }

  return (
    <section className="space-y-10">
      {/* Header with staggered animation */}
      <header 
        className="animate-hero-fade-up"
        style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
      >
        <p className="font-ui text-xs uppercase tracking-[0.2em] text-[var(--zen-text-muted)]">
          Profile
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--zen-text)] md:text-5xl">
          My Identity
        </h1>
        <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-[var(--zen-accent)] to-transparent" />
      </header>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Main profile card - spans 3 columns */}
        <div 
          className="space-y-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm lg:col-span-3"
          style={{ 
            animationDelay: '0.2s', 
            animationFillMode: 'backwards',
            boxShadow: '0 0 40px rgba(59, 130, 246, 0.05)'
          }}
        >
          {/* Avatar section with glow */}
          <div 
            className="flex items-center gap-6 animate-hero-fade-up"
            style={{ animationDelay: '0.25s', animationFillMode: 'backwards' }}
          >
            <div className="relative">
              <div 
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--zen-accent)] to-[var(--zen-accent-hover)] text-3xl font-bold text-white shadow-xl shadow-[var(--zen-accent)]/30 ring-4 ring-[var(--zen-accent)]/20"
                style={{ transform: 'translateZ(0)' }}
              >
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              {/* Status indicator */}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[var(--zen-bg)] bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--zen-text)]">
                {user.fullName}
              </h2>
              <p className="mt-1 text-sm text-[var(--zen-text-muted)]">{user.email}</p>
            </div>
          </div>

          {/* Stats grid with premium cards */}
          <div 
            className="grid grid-cols-2 gap-4 animate-hero-fade-up"
            style={{ animationDelay: '0.35s', animationFillMode: 'backwards' }}
          >
            <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-[var(--zen-bg)] p-5 transition-all duration-300 hover:border-[var(--zen-accent)]/30 hover:bg-[var(--zen-accent)]/5">
              <div className="absolute -right-4 -top-4 text-[var(--zen-accent)]/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                <StarIcon className="h-16 w-16" />
              </div>
              <p className="relative z-10 font-ui text-xs uppercase tracking-[0.15em] text-[var(--zen-text-muted)]">
                Zen Points
              </p>
              <p className="relative z-10 mt-2 font-display text-3xl font-bold tabular-nums text-[var(--zen-accent)]">
                <AnimatedNumber value={user.zenPoints ?? 0} stiffness={80} damping={20} />
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-[var(--zen-bg)] p-5 transition-all duration-300 hover:border-purple-500/30 hover:bg-purple-500/5">
              <div className="absolute -right-4 -top-4 text-purple-500/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                <SparklesIcon className="h-16 w-16" />
              </div>
              <p className="relative z-10 font-ui text-xs uppercase tracking-[0.15em] text-[var(--zen-text-muted)]">
                Level
              </p>
              <p className="relative z-10 mt-2 font-display text-3xl font-bold tabular-nums text-purple-400">
                <AnimatedNumber value={user.currentLvl ?? 1} stiffness={80} damping={20} />
              </p>
            </div>
          </div>

          {/* Life motto with quote styling */}
          {user.lifeMotto && (
            <blockquote 
              className="relative rounded-xl border border-white/10 bg-white/[0.02] px-6 py-5 animate-hero-fade-up"
              style={{ animationDelay: '0.45s', animationFillMode: 'backwards' }}
            >
              <span className="absolute -left-2 -top-3 font-display text-5xl text-[var(--zen-accent)]/20">"</span>
              <p className="relative z-10 pl-4 font-ui text-base italic leading-relaxed text-[var(--zen-text-muted)]">
                {user.lifeMotto}
              </p>
            </blockquote>
          )}
        </div>

        {/* Achievements sidebar - spans 2 columns */}
        <div 
          className="space-y-6 lg:col-span-2 animate-hero-fade-up"
          style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
        >
          <div className="flex items-center gap-3">
            <TrophyIcon className="h-5 w-5 text-amber-500" />
            <h3 className="font-display text-lg font-medium text-[var(--zen-text)]">
              Badges & Achievements
            </h3>
          </div>
          
          {/* Empty state with premium styling */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <TrophyIcon className="h-8 w-8 text-amber-500/50" />
            </div>
            <p className="font-display text-lg font-medium text-[var(--zen-text)]">
              No badges yet
            </p>
            <p className="mt-2 text-sm text-[var(--zen-text-muted)]">
              Complete assessments to earn your first badge
            </p>
          </div>

          {/* Future badges preview */}
          <div 
            className="space-y-3 animate-hero-fade-up"
            style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}
          >
            <p className="font-ui text-xs uppercase tracking-[0.15em] text-[var(--zen-text-muted)]">
              Coming Soon
            </p>
            <div className="flex gap-2">
              {['🎯', '🧠', '⚡', '🌟'].map((emoji, i) => (
                <div
                  key={i}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-xl opacity-40 grayscale transition-all duration-300 hover:opacity-60 hover:grayscale-0"
                  title="Locked badge"
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})
