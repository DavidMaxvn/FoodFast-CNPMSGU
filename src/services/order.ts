import api from './api';

export interface OrderItemPayload {
  menuItemId: number;
  quantity: number;
}

export interface CreateOrderPayload {
  addressId: number;
  paymentMethod: string; // e.g. 'VNPAY' | 'COD'
  note?: string;
  items: OrderItemPayload[];
}

export const createOrder = async (userId: number, payload: CreateOrderPayload) => {
  const res = await api.post(`/orders`, payload, { params: { userId } });
  return res.data; // Order object
};

export const getOrderById = async (userId: number, orderId: number) => {
  const res = await api.get(`/orders/${orderId}`, { params: { userId } });
  return res.data;
};

export const listMyOrders = async (userId: number) => {
  const res = await api.get(`/orders/me`, { params: { userId } });
  return res.data;
};