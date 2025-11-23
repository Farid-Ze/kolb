import { Storefront } from '../features/store'

export function StorePage() {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-slate-500">Store / Present</p>
        <h1 className="text-3xl font-semibold text-slate-900">ZenStore</h1>
        <p className="text-slate-600">Redeem products using zen points and contributions aligned with backend eligibility.</p>
      </header>
      <Storefront />
    </section>
  )
}
