import { ChallengesPanel } from '../features/future-dashboard/components/ChallengesPanel'
import { KiteSummary } from '../features/future-dashboard/components/KiteSummary'
import { PercentileSummary } from '../features/future-dashboard/components/PercentileSummary'
import { useFutureDashboardData } from '../features/future-dashboard/hooks/useFutureDashboardData'
import { SkeletonPage } from '../shared/ui/Skeleton'
import { Icon } from '../shared/ui/Icon'

/**
 * AWWWARDS-LEVEL DASHBOARD PAGE
 * 
 * Premium features:
 * - Staggered entrance animations
 * - Skeleton loading states
 * - Premium error states
 * - Consistent typography hierarchy
 */

export function FutureDashboardPage() {
  const {
    results,
    isLoadingResults,
    resultsError,
    challenges,
    isLoadingChallenges,
    challengesError,
  } = useFutureDashboardData()

  // Show skeleton during initial load
  if (isLoadingResults && !results) {
    return <SkeletonPage />
  }

  return (
    <section className="space-y-8">
      {/* Header - Staggered entrance */}
      <header 
        className="animate-hero-fade-up opacity-0"
        style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
      >
        <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3">
          Future / Self
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white tracking-[-0.02em]">
              Assessment Dashboard
            </h1>
            <p className="mt-2 font-ui text-sm text-gray-400 max-w-md">
              Review your latest kite coordinates and growth challenges.
            </p>
          </div>
          
          {/* Refresh indicator */}
          {isLoadingResults && (
            <div className="flex items-center gap-2 text-indigo-400">
              <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              <span className="font-ui text-xs uppercase tracking-wider">Refreshing...</span>
            </div>
          )}
        </div>
      </header>

      {/* Error State - Premium */}
      {resultsError && (
        <div 
          className="animate-hero-fade-up rounded-2xl border border-red-500/20 bg-red-500/5 p-6"
          role="alert"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-red-500/10">
              <Icon name="alert-circle" size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="font-ui text-sm font-semibold text-red-400 mb-1">
                Unable to load results
              </h3>
              <p className="font-ui text-sm text-gray-400">
                {resultsError.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Kite Summary - Staggered */}
      <div 
        className="animate-hero-fade-up opacity-0"
        style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
      >
        <KiteSummary results={results} />
      </div>

      {/* Percentile Summary - Staggered */}
      <div 
        className="animate-hero-fade-up opacity-0"
        style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
      >
        <PercentileSummary results={results} />
      </div>

      {/* Challenges Error */}
      {challengesError && (
        <div 
          className="animate-hero-fade-up rounded-2xl border border-red-500/20 bg-red-500/5 p-6"
          role="alert"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-red-500/10">
              <Icon name="alert-circle" size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="font-ui text-sm font-semibold text-red-400 mb-1">
                Unable to load challenges
              </h3>
              <p className="font-ui text-sm text-gray-400">
                {challengesError.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Challenges Panel - Staggered */}
      <div 
        className="animate-hero-fade-up opacity-0"
        style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
      >
        <ChallengesPanel 
          challenges={challenges} 
          isLoading={isLoadingChallenges} 
          blindspots={results?.blindspots} 
        />
      </div>
    </section>
  )
}
