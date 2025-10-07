import api from './api';

export interface MenuItemDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
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
    available: !!i.available,
  }));
}