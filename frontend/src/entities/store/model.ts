export interface Product {
  id: number
  slug: string
  name: string
  description: string
  basePrice: number
  requiredBadgeId?: number | null
  meta?: Record<string, unknown> | null
  eligible: boolean
}

export interface CartItem {
  productId: number
  quantity: number
}

export interface CheckoutRequest {
  items?: CartItem[] | null
  productId?: number | null
  quantity?: number
  contributionPoints?: number
}

export interface StoreOrderItem {
  productId: number
  quantity: number
  priceAtPurchase: number
}

export interface StoreOrder {
  id: string
  totalAmount: number
  contributionPoints: number
  paymentStatus: string
  snapToken?: string | null
  createdAt: string
  items: StoreOrderItem[]
  remainingPoints?: number | null
}

export interface CommunityFundSummary {
  totalPoints: number
  contributors: number
}
