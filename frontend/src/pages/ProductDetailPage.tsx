import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ShoppingBag, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'

import { checkout, fetchProduct } from '../features/store/api'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const productId = Number(id)

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    enabled: !isNaN(productId),
  })

  const buyMutation = useMutation({
    mutationFn: checkout,
    onSuccess: (data) => {
      // In a real app, we'd redirect to a payment gateway or show a success message
      // For now, let's just alert and maybe go back to store
      alert(`Order created! ID: ${data.id}. Total: ${data.totalAmount}`)
      navigate('/store')
    },
    onError: (err) => {
      alert('Failed to purchase product.')
      console.error(err)
    },
  })

  const handleBuy = () => {
    if (!product) return
    if (!confirm(`Purchase ${product.name} for ${product.basePrice} IDR?`)) return
    
    buyMutation.mutate({
      productId: product.id,
      quantity: 1,
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--zen-accent)] border-t-transparent" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <p className="text-[var(--zen-text-muted)]">Product not found.</p>
        <Link to="/store" className="text-sm font-medium text-[var(--zen-accent)] hover:underline">
          Back to Store
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link to="/store" className="flex items-center gap-2 text-sm text-[var(--zen-text-muted)] hover:text-[var(--zen-text)]">
        <ArrowLeft className="h-4 w-4" />
        Back to Store
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="flex items-center justify-center bg-[var(--zen-bg)] p-12">
            <ShoppingBag className="h-32 w-32 text-[var(--zen-text-muted)] opacity-20" />
          </div>
          
          <div className="flex flex-col justify-between p-8">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--zen-text)]">{product.name}</h1>
                <p className="text-lg font-medium text-[var(--zen-accent)]">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.basePrice)}
                </p>
              </div>

              <p className="text-[var(--zen-text-muted)]">{product.description}</p>

              {product.requiredBadgeId && (
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  product.eligible 
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}>
                  {product.eligible ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  <span>
                    {product.eligible 
                      ? 'You are eligible to purchase this item.' 
                      : 'You do not meet the badge requirements for this item.'}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                onClick={handleBuy}
                disabled={!product.eligible || buyMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--zen-accent)] px-4 py-3 font-medium text-white transition-colors hover:bg-[var(--zen-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buyMutation.isPending ? 'Processing...' : 'Buy Now'}
              </button>
              {!product.eligible && (
                <p className="mt-2 text-center text-xs text-[var(--zen-text-muted)]">
                  Complete more challenges to unlock this item.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
