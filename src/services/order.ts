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
  address?: { line1: string; ward?: string; district?: string; city: string };
  paymentMethod?: string;
  paymentStatus?: string;
  orderItems?: OrderItemDTO[];
  estimatedDelivery?: string;
}

// Backend OrderResponse for admin/merchant listing
export interface OrderResponseItem {
  id: number;
  menuItemId?: number;
  menuItemName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface OrderResponse {
  id: number;
  status: 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  address?: any;
  note?: string;
  items?: OrderResponseItem[];
  createdAt?: string;
  updatedAt?: string;
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
  const origin = (api.defaults.baseURL || '').replace(/\/+$/, '').replace(/\/api$/, '');
  return url.startsWith('/') ? `${origin}${url}` : url;
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
// Merchant / Staff / Admin specific order management functions
// ================================================

export interface StoreOrder {
  id: number;
  code?: string;
  customerName?: string;
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

// New: list orders by status with pagination (for all roles)
export async function getOrdersByStatus(status: string, page: number = 0, size: number = 20): Promise<Page<OrderResponse>> {
  const res = await api.get('/orders/status', {
    params: { status, page, size },
  });
  return res.data;
}

// Old function was pointing to /orders/store which backend doesn't expose; keep for compatibility if needed
export async function getOrdersByStore(status: string, page: number = 0, size: number = 10): Promise<Page<StoreOrder>> {
  const res = await api.get('/orders/status', {
    params: { status, page, size },
  });
  // Map to StoreOrder-like for legacy views
  const data: Page<OrderResponse> = res.data;
  return {
    content: (data.content || []).map((o) => ({
      id: o.id,
      code: String(o.id),
      customerName: undefined,
      totalAmount: Number(o.totalAmount || 0),
      status: o.status,
      createdAt: String(o.createdAt || ''),
    })),
    totalPages: data.totalPages || 0,
    totalElements: data.totalElements || 0,
    number: data.number || 0,
    size: data.size || size,
  };
}

// Update order status: backend expects PATCH and status as request param
export async function updateOrderStatus(orderId: number, status: string): Promise<OrderDTO> {
  const res = await api.patch(`/orders/${orderId}/status`, null, { params: { status } });
  return res.data;
}

// ================================================
// Drone Assignment and Tracking APIs
// ================================================

export interface DroneAssignmentResponse {
  orderId: number;
  droneId: number;
  deliveryId: number;
  message: string;
}

export interface DeliveryTrackingResponse {
  orderId: number;
  droneId: number;
  deliveryId: number;
  status: string;
  currentLat: number;
  currentLng: number;
  progress: number;
  estimatedArrival: string;
  waypoints: Array<{
    lat: number;
    lng: number;
    timestamp: string;
  }>;
}

// Auto-assign drone to order when status is READY_FOR_DELIVERY
export async function assignDroneToOrder(orderId: number): Promise<DroneAssignmentResponse> {
  const res = await api.post(`/orders/${orderId}/assign-drone`);
  return res.data;
}

// Get real-time delivery tracking information
export async function getDeliveryTracking(orderId: number): Promise<DeliveryTrackingResponse> {
  const res = await api.get(`/orders/${orderId}/delivery-tracking`);
  return res.data;
}

// Complete delivery manually
export async function completeDelivery(orderId: number): Promise<{ message: string }> {
  const res = await api.post(`/orders/${orderId}/complete-delivery`);
  return res.data;
}