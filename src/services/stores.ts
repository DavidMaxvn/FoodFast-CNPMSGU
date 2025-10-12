import api from './api';

export interface StoreDTO {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface StoreViewModel {
  id: string;
  name: string;
  address: string;
  phone: string;
  image?: string;
  lat?: number;
  lng?: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

export async function fetchStores(openOnly = true): Promise<StoreViewModel[]> {
  const res = await api.get('/stores', { params: openOnly ? { open: true } : {} });
  const stores: StoreDTO[] = res.data;
  return stores.map((s) => ({
    id: String(s.id),
    name: s.name,
    address: s.address || '',
    phone: s.phone || '',
    image: s.imageUrl ? (s.imageUrl.startsWith('/') ? `${(api.defaults.baseURL || '').replace(/\/+$/, '')}${s.imageUrl}` : s.imageUrl) : '',
    lat: s.lat,
    lng: s.lng,
    status: s.status,
  }));
}

export async function fetchStoreById(id: string | number): Promise<StoreViewModel | null> {
  try {
    const res = await api.get(`/stores/${id}`);
    const s: StoreDTO = res.data;
    return {
      id: String(s.id),
      name: s.name,
      address: s.address || '',
      phone: s.phone || '',
      image: s.imageUrl ? (s.imageUrl.startsWith('/') ? `${(api.defaults.baseURL || '').replace(/\/+$/, '')}${s.imageUrl}` : s.imageUrl) : '',
      lat: s.lat,
      lng: s.lng,
      status: s.status,
    };
  } catch {
    return null;
  }
}

export interface MenuItemDTO {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  category?: { id: number; name: string };
}

export interface MenuItemViewModel {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
}

export async function fetchStoreMenu(storeId: string | number, page = 0, size = 12): Promise<MenuItemViewModel[]> {
  const res = await api.get(`/stores/${storeId}/menu`, { params: { page, size } });
  const items: MenuItemDTO[] = res.data;
  return items.map((i) => ({
    id: String(i.id),
    name: i.name,
    description: i.description || '',
    price: Number(i.price),
    image: i.imageUrl ? (i.imageUrl.startsWith('/') ? `${(api.defaults.baseURL || '').replace(/\/+$/, '')}${i.imageUrl}` : i.imageUrl) : '',
    category: i.category?.name || 'Other',
    available: !!i.available,
  }));
}