import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="space-y-4 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-[var(--zen-text-muted)]">The page you are looking for could not be found.</p>
      <Link className="text-[var(--zen-accent)]" to="/">
        Return home
      </Link>
    </section>
  )
}
