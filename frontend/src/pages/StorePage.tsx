import { Storefront } from '../features/store'

export function StorePage() {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">Store / Present</p>
        <h1 className="text-3xl font-semibold text-[var(--zen-text)]">ZenStore</h1>
        <p className="text-[var(--zen-text-muted)]">Redeem products using zen points and contributions aligned with backend eligibility.</p>
      </header>
      <Storefront />
    </section>
  )
}
