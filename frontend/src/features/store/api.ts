import { apiClient } from '../../shared/api/client'
import type { CheckoutRequest, CommunityFundSummary, Product, StoreOrder } from '../../entities/store/model'

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>('/store/products')
  return data
}

export async function fetchProduct(productId: number): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/store/products/${productId}`)
  return data
}

export async function fetchCommunityFund(): Promise<CommunityFundSummary> {
  const { data } = await apiClient.get<CommunityFundSummary>('/store/community-fund')
  return data
}

export async function checkout(payload: CheckoutRequest): Promise<StoreOrder> {
  const { data } = await apiClient.post<StoreOrder>('/store/checkout', payload)
  return data
}
