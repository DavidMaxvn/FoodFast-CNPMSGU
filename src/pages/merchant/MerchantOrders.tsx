import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * M03 - Orders List (Mock)
 * - TODO: Gọi API danh sách đơn hàng đang xử lý, phân trang/lọc (sau)
 * - Hiện hiển thị danh sách giả.
 */
interface OrderItem {
  id: number;
  code: string;
  customer: string;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
}

const MOCK_ORDERS: OrderItem[] = [
  { id: 101, code: 'ORD-101', customer: 'Nguyễn Văn A', total: 250000, status: 'pending' },
  { id: 102, code: 'ORD-102', customer: 'Trần Thị B', total: 175000, status: 'preparing' },
  { id: 103, code: 'ORD-103', customer: 'Lê C', total: 320000, status: 'ready' },
];

const statusColor = (s: OrderItem['status']) => {
  switch (s) {
    case 'pending': return 'warning';
    case 'preparing': return 'info';
    case 'ready': return 'success';
    case 'delivered': return 'default';
  }
};

const MerchantOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderItem[]>([]);

  useEffect(() => {
    // TODO: Gọi API lấy danh sách đơn hàng (sau)
    setOrders(MOCK_ORDERS);
  }, []);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Orders đang xử lý
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Mã đơn</TableCell>
            <TableCell>Khách hàng</TableCell>
            <TableCell>Tổng (VND)</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id} hover>
              <TableCell>{o.code}</TableCell>
              <TableCell>{o.customer}</TableCell>
              <TableCell>{o.total.toLocaleString('vi-VN')}</TableCell>
              <TableCell><Chip label={o.status} color={statusColor(o.status) as any} /></TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => navigate(`/merchant/orders/${o.id}`)}>Chi tiết</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default MerchantOrders;