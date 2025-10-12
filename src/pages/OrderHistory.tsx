import React, { useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface OrderItemVM {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderVM {
  id: string;
  status: 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  total: number;
  createdAt: string;
  items: OrderItemVM[];
}

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  // TODO(API): Thay mock bằng dữ liệu từ listMyOrders(userId) trong services/order
  const orders = useMemo<OrderVM[]>(() => ([
    {
      id: '1001',
      status: 'COMPLETED',
      total: 159000,
      createdAt: '2025-10-07 12:15',
      items: [
        { id: 'm1', name: 'Cheese Burger', quantity: 2, price: 59000 },
        { id: 'm7', name: 'Coke', quantity: 1, price: 41000 },
      ],
    },
    {
      id: '1002',
      status: 'DELIVERING',
      total: 89000,
      createdAt: '2025-10-08 09:45',
      items: [
        { id: 'm3', name: 'Fried Chicken', quantity: 1, price: 89000 },
      ],
    },
  ]), []);

  const statusColor = (s: OrderVM['status']) => {
    switch (s) {
      case 'COMPLETED': return 'success';
      case 'DELIVERING': return 'info';
      case 'PREPARING': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Lịch sử đơn hàng</Typography>
      <Grid container spacing={2}>
        {orders.map((o) => (
          <Grid item xs={12} md={6} key={o.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Đơn #{o.id}</Typography>
                  <Chip label={o.status} color={statusColor(o.status) as any} size="small" />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Tạo lúc: {o.createdAt}</Typography>
                <Box sx={{ mt: 1 }}>
                  {o.items.map((it) => (
                    <Typography key={it.id} variant="body2">
                      {it.quantity} x {it.name} · {(it.price * it.quantity).toLocaleString()} ₫
                    </Typography>
                  ))}
                </Box>
                <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>Tổng: {o.total.toLocaleString()} ₫</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={() => navigate(`/order/tracking/${o.id}`)}>Theo dõi</Button>
                  <Button variant="contained" onClick={() => navigate(`/order/confirmation/${o.id}`)}>Xem xác nhận</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default OrderHistory;