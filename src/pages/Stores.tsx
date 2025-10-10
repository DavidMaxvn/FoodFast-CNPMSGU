import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Button, CircularProgress, CardMedia, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchStores, StoreViewModel } from '../services/stores';

// Mock data for stores UI while backend is not ready
const MOCK_STORES: StoreViewModel[] = [
  {
    id: 's1',
    name: 'FastFood Center - Quận 1',
    address: '123 Lê Lợi, P. Bến Nghé, Q1, TP.HCM',
    phone: '0901 234 567',
    image: 'https://source.unsplash.com/random/800x400/?restaurant',
    status: 'ACTIVE',
  },
  {
    id: 's2',
    name: 'FastFood Drive - Quận 3',
    address: '45 Cách Mạng Tháng 8, Q3, TP.HCM',
    phone: '0902 345 678',
    image: 'https://source.unsplash.com/random/800x400/?fastfood',
    status: 'ACTIVE',
  },
  {
    id: 's3',
    name: 'FastFood Express - Thủ Đức',
    address: '88 Võ Văn Ngân, TP. Thủ Đức',
    phone: '0903 456 789',
    image: 'https://source.unsplash.com/random/800x400/?food,store',
    status: 'SUSPENDED',
  },
];

const Stores: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreViewModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');

  // Ensure hooks are called before any early returns
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(s => s.name.toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q));
  }, [stores, search]);

  useEffect(() => {
    // TODO(API): Thay bằng fetchStores(openOnly) khi backend sẵn sàng
    (async () => {
      try {
        setLoading(true);
        const data = await fetchStores(true);
        setStores(data.length ? data : MOCK_STORES);
        setError('');
      } catch {
        // Fallback to mock when API fails
        setStores(MOCK_STORES);
        setError('');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>;
  }

  

  return (
    <Box>
      {/* Hero section */}
      <Box sx={{
        mb: 3,
        p: 4,
        borderRadius: 2,
        color: '#fff',
        background: 'linear-gradient(135deg, #FF3D00 0%, #FF7043 50%, #FFC107 100%)'
      }}>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>Nhanh · Ngon · Rẻ</Typography>
        <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.9 }}>
          Chọn cửa hàng gần bạn và đặt món yêu thích ngay.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="contained" color="secondary" onClick={() => navigate('/cart')}>Đặt ngay</Button>
          <Button variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.8)' }} onClick={() => navigate('/orders/history')}>Xem đơn gần đây</Button>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Cửa hàng đang hoạt động</Typography>
        <Box sx={{ flex: 1 }} />
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          placeholder="Tìm cửa hàng theo tên hoặc địa chỉ"
        />
      </Box>
      <Grid container spacing={2}>
        {filtered.map((s) => (
          <Grid item xs={12} sm={6} md={4} key={s.id}>
            <Card>
              {s.image && (
                <CardMedia
                  component="img"
                  height="140"
                  image={s.image}
                  alt={s.name}
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                  <Chip label={s.status === 'ACTIVE' ? 'Active' : 'Suspended'} color={s.status === 'ACTIVE' ? 'success' : 'default'} size="small" />
                </Box>
                {s.address && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>{s.address}</Typography>
                )}
                {s.phone && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Điện thoại: {s.phone}</Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="primary" onClick={() => navigate(`/stores/${s.id}/menu`)}>
                    Xem thực đơn
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Stores;