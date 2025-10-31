import api from './api';

export interface MenuItemDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  category?: { id: number; name: string };
  store?: { id: number; name: string };
}

export interface MenuItemViewModel {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  store: string;
  storeId?: string;
  available: boolean;
}

export interface CategoryDTO {
  id: number;
  name: string;
  store?: { id: number; name: string };
  sortOrder?: number;
}

export interface StoreDTO {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  imageUrl?: string;
  status?: string;
}

export async function fetchMenuItems(page = 0, size = 12): Promise<MenuItemViewModel[]> {
  const res = await api.get(`/menu/items`, { params: { page, size } });
  const items: MenuItemDTO[] = res.data;
  return items.map((i) => ({
    id: String(i.id),
    name: i.name,
    description: i.description || '',
    price: Number(i.price),
    image: i.imageUrl ? (i.imageUrl.startsWith('/') ? `${(api.defaults.baseURL || '').replace(/\/+$/, '')}${i.imageUrl}` : i.imageUrl) : '',
    category: i.category?.name || 'Other',
    store: i.store?.name || 'Unknown',
    storeId: i.store?.id ? String(i.store.id) : undefined,
    available: !!i.available,
  }));
}

export async function fetchItemsByCategory(categoryId: number, page = 0, size = 12): Promise<MenuItemViewModel[]> {
  const res = await api.get(`/menu/category/${categoryId}`, { params: { page, size } });
  const items: MenuItemDTO[] = res.data;
  return items.map((i) => ({
    id: String(i.id),
    name: i.name,
    description: i.description || '',
    price: Number(i.price),
    image: i.imageUrl ? (i.imageUrl.startsWith('/') ? `${(api.defaults.baseURL || '').replace(/\/+$/, '')}${i.imageUrl}` : i.imageUrl) : '',
    category: i.category?.name || 'Other',
    store: i.store?.name || 'Unknown',
    storeId: i.store?.id ? String(i.store.id) : undefined,
    available: !!i.available,
  }));
}

export async function searchMenuItems(name: string, page = 0, size = 12): Promise<MenuItemViewModel[]> {
  const res = await api.get(`/menu/search`, { params: { name, page, size } });
  const items: MenuItemDTO[] = res.data;
  return items.map((i) => ({
    id: String(i.id),
    name: i.name,
    description: i.description || '',
    price: Number(i.price),
    image: i.imageUrl ? (i.imageUrl.startsWith('/') ? `${(api.defaults.baseURL || '').replace(/\/+$/, '')}${i.imageUrl}` : i.imageUrl) : '',
    category: i.category?.name || 'Other',
    store: i.store?.name || 'Unknown',
    storeId: i.store?.id ? String(i.store.id) : undefined,
    available: !!i.available,
  }));
}

// Admin functions for CRUD operations
export async function createMenuItem(item: Omit<MenuItemDTO, 'id'>): Promise<MenuItemDTO> {
  const res = await api.post('/menu/items', item);
  return res.data;
}

export async function updateMenuItem(id: number, item: Partial<MenuItemDTO>): Promise<MenuItemDTO> {
  const res = await api.put(`/menu/items/${id}`, item);
  return res.data;
}

export async function deleteMenuItem(id: number): Promise<void> {
  await api.delete(`/menu/items/${id}`);
}

export async function getAllMenuItems(page = 0, size = 20): Promise<MenuItemViewModel[]> {
  const res = await api.get(`/menu/all`, { params: { page, size } });
  const items: MenuItemDTO[] = res.data;
  return items.map((i) => ({
    id: String(i.id),
    name: i.name,
    description: i.description || '',
    price: Number(i.price),
    image: i.imageUrl ? (i.imageUrl.startsWith('/') ? `${(api.defaults.baseURL || '').replace(/\/+$/, '')}${i.imageUrl}` : i.imageUrl) : '',
    category: i.category?.name || 'Other',
    store: i.store?.name || 'Unknown',
    storeId: i.store?.id ? String(i.store.id) : undefined,
    available: !!i.available,
  }));
}

// Functions for categories and stores
export async function fetchCategories(): Promise<CategoryDTO[]> {
  const res = await api.get('/menu/categories');
  return res.data;
}

export async function fetchStores(): Promise<StoreDTO[]> {
  const res = await api.get('/menu/stores');
  return res.data;
}