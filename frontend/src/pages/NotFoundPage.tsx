import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="space-y-4 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-slate-600">The page you are looking for could not be found.</p>
      <Link className="text-indigo-600" to="/">
        Return home
      </Link>
    </section>
  )
}
