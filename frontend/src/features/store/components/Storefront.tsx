import { useState } from 'react'

import { useStorefront } from '../hooks/useStorefront'
import { Button } from '../../../shared/ui/Button'

export function Storefront() {
  const [points, setPoints] = useState(0)
  const {
    products,
    isLoadingProducts,
    communityFund,
    isLoadingCommunityFund,
    cart,
    addToCart,
    removeFromCart,
    totalItems,
    totalPrice,
    placeOrder,
    isCheckingOut,
    checkoutError,
    checkoutReceipt,
  } = useStorefront()

  const handleCheckout = async () => {
    try {
      await placeOrder(points)
    } catch (error) {
      console.error('Checkout failed', error)
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">ZenStore</p>
          <h1 className="text-3xl font-semibold text-[var(--zen-text)]">Badge-gated items</h1>
          <p className="text-[var(--zen-text-muted)]">Products are tailored to your achievements; eligibility is enforced server-side.</p>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-emerald-900">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-600">Community fund</p>
              {isLoadingCommunityFund ? (
                <p className="text-sm text-emerald-700">Syncing contribution stats…</p>
              ) : communityFund ? (
                <p className="text-lg font-semibold">
                  {communityFund.totalPoints.toLocaleString('id-ID')} pts raised by {communityFund.contributors} contributors
                </p>
              ) : (
                <p className="text-sm text-emerald-700">No contribution data yet.</p>
              )}
            </div>
          </div>
        </header>
        {isLoadingProducts ? (
          <p className="text-sm text-[var(--zen-text-muted)]">Loading products…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <article className="rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-4 shadow-sm" key={product.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--zen-text)]">{product.name}</h2>
                    <p className="text-sm text-[var(--zen-text-muted)]">{product.description}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--zen-text)]">Rp {product.basePrice.toLocaleString('id-ID')}</p>
                </div>
                <Button
                  className="mt-4 w-full"
                  disabled={!product.eligible}
                  onClick={() => addToCart(product.id)}
                  type="button"
                >
                  {product.eligible ? 'Add to cart' : 'Requires badge'}
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4 rounded-2xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-6 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-[var(--zen-text-muted)]">Cart</p>
          <h2 className="text-xl font-semibold text-[var(--zen-text)]">{totalItems} item(s)</h2>
        </header>
        <ul className="space-y-3 text-sm">
          {cart.length === 0 && <li className="text-[var(--zen-text-muted)]">Your cart is empty.</li>}
          {cart.map((item) => {
            const product = products.find((p) => p.id === item.productId)
            if (!product) return null
            return (
              <li key={item.productId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--zen-text)]">{product.name}</p>
                  <p className="text-xs text-[var(--zen-text-muted)]">Qty: {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--zen-text)]">
                    Rp {(product.basePrice * item.quantity).toLocaleString('id-ID')}
                  </span>
                  <button className="text-xs text-rose-500" onClick={() => removeFromCart(item.productId)} type="button">
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-500" htmlFor="contribution">
            Contribution points
          </label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            id="contribution"
            min={0}
            onChange={(event) => setPoints(Number(event.target.value) || 0)}
            type="number"
            value={points}
          />
        </div>

        <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
          <span>Total</span>
          <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
        </div>

        <Button className="w-full" disabled={cart.length === 0} isLoading={isCheckingOut} onClick={handleCheckout} type="button">
          Checkout
        </Button>

        {checkoutError && (
          <p className="text-sm text-rose-500">Checkout failed: {checkoutError.message}</p>
        )}
        {checkoutReceipt && (
          <p className="text-sm text-emerald-600">Order #{checkoutReceipt.id} created. Payment status: {checkoutReceipt.paymentStatus}</p>
        )}
      </aside>
    </section>
  )
}
