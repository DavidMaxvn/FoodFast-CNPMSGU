import api from './api';

export interface OrderItemDTO {
  id: number;
  quantity: number;
  unitPrice?: number;
  menuItem?: { id: number; name: string; imageUrl?: string; price?: number };
}

export interface OrderDTO {
  id: number;
  status: 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  totalAmount?: number;
  createdAt?: string;
  address?: { line1: string; ward?: string; district?: string; city?: string };
  paymentMethod?: string;
  paymentStatus?: string;
  orderItems?: OrderItemDTO[];
}

export interface OrderItemVM {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderVM {
  id: string;
  status: 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  total: number;
  createdAt: string;
  items: OrderItemVM[];
}

function resolveImage(url?: string): string {
  if (!url) return '';
  return url.startsWith('/')
    ? `${(api.defaults.baseURL || '').replace(/\/+$/, '')}${url}`
    : url;
}

function toVM(order: OrderDTO): OrderVM {
  const items: OrderItemVM[] = Array.isArray(order.orderItems)
    ? order.orderItems.map((it) => ({
        id: String(it.id ?? `${order.id}-${Math.random()}`),
        name: it.menuItem?.name || 'Item',
        quantity: Number(it.quantity ?? 0),
        price: Number(it.unitPrice ?? it.menuItem?.price ?? 0),
        image: resolveImage(it.menuItem?.imageUrl),
      }))
    : [];

  return {
    id: String(order.id),
    status: order.status || 'CREATED',
    total: Number(order.totalAmount ?? 0),
    createdAt: order.createdAt || '',
    items,
  };
}

export async function getOrderById(userId: string | number, orderId: string | number): Promise<OrderDTO> {
  const res = await api.get(`/orders/${orderId}`, { params: { userId } });
  return res.data;
}

export async function listMyOrders(userId: string | number): Promise<OrderVM[]> {
  const res = await api.get('/orders/me', { params: { userId } });
  const orders: OrderDTO[] = res.data;
  return orders.map(toVM);
}

// Types used when creating an order from Checkout
export interface CreateOrderItemRequest { menuItemId: number; quantity: number }
export interface CreateOrderRequest {
  addressId: number;
  paymentMethod: string; // e.g. 'VNPAY' | 'COD'
  note?: string;
  items: CreateOrderItemRequest[];
}

export async function createOrder(userId: string | number, payload: CreateOrderRequest): Promise<OrderDTO> {
  const res = await api.post('/orders', payload, { params: { userId } });
  return res.data;
}

export async function getMyOrders(userId: string | number): Promise<OrderDTO[]> {
  const res = await api.get('/orders/me', { params: { userId } });
  return res.data;
}

// ================================================
// Merchant / Staff specific order management functions
// ================================================

export interface StoreOrder {
  id: number;
  code: string;
  customerName: string;
  totalAmount: number;
  status: 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export async function getOrdersByStore(status: string, page: number = 0, size: number = 10): Promise<Page<StoreOrder>> {
  const res = await api.get('/orders/store', {
    params: { status, page, size },
  });
  return res.data;
}

export async function updateOrderStatus(orderId: number, status: string): Promise<OrderDTO> {
  const res = await api.put(`/orders/${orderId}/status`, { status });
  return res.data;
}