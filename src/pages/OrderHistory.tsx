import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getMyOrders, OrderDTO, OrderVM } from '../services/order';

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [orders, setOrders] = useState<OrderDTO[]>([]);

  useEffect(() => {
    if (user?.id) {
      getMyOrders(user.id)
        .then((data) => {
          console.log("API Response Data:", data);
          setOrders(data);
        })
        .catch((error) => {
          console.error("Failed to fetch orders:", error);
        });
    }
  }, [user]);

  const statusColor = (s: OrderVM['status']) => {
    switch (s) {
      case 'COMPLETED':
        return 'success';
      case 'DELIVERING':
        return 'info';
      case 'PREPARING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
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
                  {o.orderItems?.map((it) => (
                    <Typography key={it.id} variant="body2">
                      {it.quantity} x {it.menuItem?.name} · ${(it.unitPrice! * it.quantity).toLocaleString()}
                    </Typography>
                  ))}
                </Box>
                <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>Tổng: ${o.totalAmount?.toLocaleString()}</Typography>
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