import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import type { CartItem } from '../../../entities/store/model'
import { checkout, fetchCommunityFund, fetchProducts } from '../api'

export function useStorefront() {
  const [cart, setCart] = useState<CartItem[]>([])
  const productsQuery = useQuery({ queryKey: ['store', 'products'], queryFn: fetchProducts })
  const communityFundQuery = useQuery({ queryKey: ['store', 'community-fund'], queryFn: fetchCommunityFund })

  const checkoutMutation = useMutation({
    mutationFn: checkout,
    onSuccess: () => setCart([]),
  })

  const addToCart = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { productId, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart])

  const totalPrice = useMemo(() => {
    if (!productsQuery.data) {
      return 0
    }
    return cart.reduce((sum, item) => {
      const product = productsQuery.data.find((p) => p.id === item.productId)
      return sum + (product?.basePrice ?? 0) * item.quantity
    }, 0)
  }, [cart, productsQuery.data])

  const placeOrder = (contributionPoints = 0) => {
    return checkoutMutation.mutateAsync({ items: cart, contributionPoints })
  }

  return {
    cart,
    products: productsQuery.data ?? [],
    communityFund: communityFundQuery.data,
    isLoadingProducts: productsQuery.isLoading,
    isLoadingCommunityFund: communityFundQuery.isLoading,
    addToCart,
    removeFromCart,
    totalItems,
    totalPrice,
    placeOrder,
    isCheckingOut: checkoutMutation.status === 'pending',
    checkoutError: checkoutMutation.error as Error | null,
    checkoutReceipt: checkoutMutation.data,
  }
}
