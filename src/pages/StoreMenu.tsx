import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Grid, Card, CardContent, CardMedia, Typography, Button, CircularProgress, CardActions } from '@mui/material';
import { fetchStoreMenu, fetchStoreById, MenuItemViewModel, StoreViewModel } from '../services/stores';
import { addToCart } from '../store/slices/cartSlice';

// Mock data for store menu while backend is not ready
const BACKEND_ORIGIN = (process.env.REACT_APP_API_BASE || 'http://localhost:8081').replace(/\/+$/, '');
const MOCK_STORE: StoreViewModel = {
  id: 's1',
  name: 'FastFood Center - Quận 1',
  address: '123 Lê Lợi, P. Bến Nghé, Q1, TP.HCM',
  phone: '0901 234 567',
  image: `${BACKEND_ORIGIN}/images/menu/burgers/cheeseburger.jpg`,
  status: 'ACTIVE',
};

const MOCK_MENU: MenuItemViewModel[] = [
  { id: 'm1', name: 'Cheeseburger', description: 'Bánh burger phô mai thơm ngon', price: 59000, image: `${BACKEND_ORIGIN}/images/menu/burgers/cheeseburger.jpg`, category: 'Burgers', available: true },
  { id: 'm2', name: 'French Fries', description: 'Khoai tây chiên giòn rụm', price: 29000, image: `${BACKEND_ORIGIN}/images/menu/sides/french-fries.jpg`, category: 'Sides', available: true },
  { id: 'm3', name: 'Fried Chicken', description: 'Gà rán giòn tan', price: 89000, image: `${BACKEND_ORIGIN}/images/menu/chicken/chicken-wings.jpg`, category: 'Chicken', available: true },
  { id: 'm4', name: 'Coca Cola', description: 'Nước uống có ga', price: 19000, image: `${BACKEND_ORIGIN}/images/menu/drinks/coca-cola.jpg`, category: 'Drinks', available: true },
];

const StoreMenu: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [items, setItems] = useState<MenuItemViewModel[]>([]);
  const [store, setStore] = useState<StoreViewModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // TODO(API): Thay thế mock bằng fetchStoreById / fetchStoreMenu khi backend sẵn sàng
    (async () => {
      if (!id) {
        setStore(MOCK_STORE);
        setItems(MOCK_MENU);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [storeInfo, menu] = await Promise.all([
          fetchStoreById(id),
          fetchStoreMenu(id, 0, 12),
        ]);
        setStore(storeInfo || MOCK_STORE);
        setItems(menu.length ? menu : MOCK_MENU);
      } catch (e) {
        setError(null as any);
        setStore(MOCK_STORE);
        setItems(MOCK_MENU);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    // On mock fallback, do not block UI by error
    return <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {store ? `Thực đơn - ${store.name}` : 'Thực đơn cửa hàng'}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/stores')}>Quay lại danh sách cửa hàng</Button>
      </Box>
      {store?.image && (
        <Box sx={{ mb: 2 }}>
          <CardMedia component="img" height="160" image={store.image} alt={store.name} sx={{ borderRadius: 1 }} />
        </Box>
      )}
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              {item.image && (
                <CardMedia component="img" height="160" image={item.image} alt={item.name} />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.description}</Typography>
                                    <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>${item.price.toLocaleString()}</Typography>
                                </CardContent>
                                <CardActions>
                  <Button
                    sx={{ mt: 1 }}
                    variant="contained"
                    color="primary"
                    onClick={() =>
                      dispatch(
                        addToCart({
                          id: String(item.id),
                          name: item.name,
                          price: Number(item.price),
                          quantity: 1,
                          image: item.image || ''
                        })
                      )
                    }
                  >
                    Thêm vào giỏ
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};

export default StoreMenu;