import type { OrderStatus } from './types'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PendingPayment: 'Aguardando pagamento', Received: 'Recebido', Preparing: 'Em preparo',
  OutForDelivery: 'Saiu para entrega', ReadyForPickup: 'Pronto para retirada', Finished: 'Finalizado', Cancelled: 'Cancelado',
}
export const STATUS_COLOR: Record<OrderStatus, string> = {
  PendingPayment: 'bg-amber-100 text-amber-800', Received: 'bg-blue-100 text-blue-800', Preparing: 'bg-orange-100 text-orange-800',
  OutForDelivery: 'bg-purple-100 text-purple-800', ReadyForPickup: 'bg-purple-100 text-purple-800',
  Finished: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-800',
}
/** Próximo passo do Kanban. */
export function nextStatus(s: OrderStatus, delivery: boolean): OrderStatus | null {
  switch (s) {
    case 'Received': return 'Preparing'
    case 'Preparing': return delivery ? 'OutForDelivery' : 'ReadyForPickup'
    case 'OutForDelivery': case 'ReadyForPickup': return 'Finished'
    default: return null
  }
}
export const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  Preparing: 'Iniciar preparo', OutForDelivery: 'Saiu p/ entrega', ReadyForPickup: 'Pronto p/ retirada', Finished: 'Finalizar',
}
