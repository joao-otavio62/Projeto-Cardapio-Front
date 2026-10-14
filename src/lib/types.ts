export type Media = { id: string; type: 'Image' | 'Video'; url: string; sortOrder: number }
export type Store = { id: string; name: string; slug: string; phone?: string | null; deliveryFee: number; minOrder: number; isOpen: boolean }

export type PublicProduct = { id: string; name: string; description?: string | null; price: number; finalPrice: number; promotionTitle?: string | null; available: boolean; media: Media[] }
export type MenuCategory = { id: string; name: string; products: PublicProduct[] }
export type Menu = { store: Store; categories: MenuCategory[] }

export type DeliveryType = 'Pickup' | 'Delivery'
export type PaymentMethod = 'Pix' | 'CreditCard'
export type OrderStatus = 'PendingPayment' | 'Received' | 'Preparing' | 'OutForDelivery' | 'ReadyForPickup' | 'Finished' | 'Cancelled'

export type CheckoutBody = {
  fullName: string; cpf: string; phone: string | null; email: string | null
  deliveryType: DeliveryType
  address: { zipCode: string; street: string; number: string; complement: string | null; district: string; city: string; state: string } | null
  notes: string | null
  items: { productId: string; quantity: number; notes: string | null }[]
  paymentMethod: PaymentMethod
  card: { token: string; paymentMethodId: string; installments: number; issuerId: string | null } | null
}
export type PaymentInfo = { method: string; status: string; pixCopyPaste?: string | null; pixQrCodeBase64?: string | null; pixExpiresAt?: string | null }
export type CheckoutResponse = { orderCode: string; status: string; statusLabel: string; total: number; payment: PaymentInfo }

export type OrderItem = { productName: string; quantity: number; unitPrice: number; total: number; notes?: string | null }
export type StatusHistory = { status: OrderStatus; statusLabel: string; at: string }
export type PublicOrder = {
  code: string; status: OrderStatus; statusLabel: string; deliveryType: DeliveryType; customerFirstName: string
  total: number; createdAt: string; items: OrderItem[]; history: StatusHistory[]; payment?: PaymentInfo | null
}

// Admin
export type AdminUser = { id: string; name: string; email: string; storeId: string }
export type LoginResponse = { accessToken: string; expiresAt: string; user: AdminUser }
export type Category = { id: string; name: string; sortOrder: number; isActive: boolean }
export type Promotion = { id: string; title: string; discountType: 'Percent' | 'Fixed'; discountValue: number; startsAt: string; endsAt: string; isActive: boolean; isCurrent: boolean }
export type Product = {
  id: string; categoryId: string; categoryName: string; name: string; description?: string | null
  price: number; finalPrice: number; promotionId?: string | null; promotionTitle?: string | null
  trackStock: boolean; stockQuantity: number; lowStockAlert: number; isActive: boolean; media: Media[]
}
export type ProductBody = {
  categoryId: string; name: string; description: string | null; price: number; promotionId: string | null
  trackStock: boolean; stockQuantity: number; lowStockAlert: number; isActive: boolean
}
export type Paged<T> = { items: T[]; page: number; pageSize: number; totalCount: number }
export type AdminOrderListItem = { id: string; code: string; status: OrderStatus; statusLabel: string; deliveryType: DeliveryType; customerName: string; total: number; seen: boolean; createdAt: string }
export type AdminOrderDetail = {
  id: string; code: string; status: OrderStatus; statusLabel: string; deliveryType: DeliveryType
  customerName: string; customerCpf: string; customerPhone?: string | null
  address?: { zipCode?: string; street?: string; number?: string; complement?: string; district?: string; city?: string; state?: string } | null
  notes?: string | null; subtotal: number; discountTotal: number; deliveryFee: number; total: number; seen: boolean; createdAt: string
  items: OrderItem[]; history: StatusHistory[]
  payments: { method: string; status: string; amount: number; installments: number; cardBrand?: string | null; cardLast4?: string | null; paidAt?: string | null }[]
}
export type NewOrderEvent = { orderId: string; code: string; customerName: string; total: number; deliveryType: DeliveryType; createdAt: string }
export type Report = {
  from: string; to: string; revenue: number; ordersCount: number; averageTicket: number; cancelledCount: number
  daily: { date: string; revenue: number; orders: number }[]
  topProducts: { productName: string; quantity: number; revenue: number }[]
  byStatus: { status: string; count: number }[]
  lowStock: { productId: string; name: string; stockQuantity: number; lowStockAlert: number }[]
}
