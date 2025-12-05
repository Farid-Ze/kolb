/**
 * Minimal page loading spinner
 * Used for Suspense fallback during lazy loading
 */
export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading page">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
