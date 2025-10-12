// Vietnamese comments:
// Dịch vụ mock cho phiên merchant: trả danh sách store với role từ /me/stores.
// API thật sẽ được comment và triển khai sau.

export interface MyStoreInfo {
  store_id: string;
  store_name: string;
  role: 'MANAGER' | 'STAFF';
}

// Mock dữ liệu: người dùng thuộc 1–2 cửa hàng với role khác nhau
const MOCK_STORES: MyStoreInfo[] = [
  { store_id: 'store-001', store_name: 'FastFood Lê Lợi', role: 'MANAGER' },
  { store_id: 'store-002', store_name: 'FastFood Nguyễn Huệ', role: 'STAFF' },
];

export async function fetchMyStores(): Promise<MyStoreInfo[]> {
  // TODO: gọi API thật
  // const res = await fetch('/api/me/stores');
  // return res.json();
  return Promise.resolve(MOCK_STORES);
}