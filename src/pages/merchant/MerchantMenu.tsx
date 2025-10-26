import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * M05 - Menu Management (Mock)
 * - TODO: Gọi API danh sách món, tìm kiếm/lọc (sau)
 * - Hiện hiển thị danh sách giả.
 */
interface MenuItemDTO { id: number; name: string; price: number; category: string; }

const MOCK_MENU: MenuItemDTO[] = [
  { id: 1, name: 'Burger Bò', price: 50000, category: 'Burgers' },
  { id: 2, name: 'Gà rán', price: 45000, category: 'Chicken' },
  { id: 3, name: 'Khoai chiên', price: 30000, category: 'Sides' },
];

const MerchantMenu: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItemDTO[]>([]);

  useEffect(() => {
    // TODO: Gọi API lấy danh sách món (sau)
    setItems(MOCK_MENU);
  }, []);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Quản lý món</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => navigate('/merchant/menu/new')}>Thêm món</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tên món</TableCell>
            <TableCell>Giá (VND)</TableCell>
            <TableCell>Danh mục</TableCell>
            <TableCell align="right">Sửa</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id}>
              <TableCell>{it.name}</TableCell>
              <TableCell>{it.price.toLocaleString('vi-VN')}</TableCell>
              <TableCell>{it.category}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => navigate('/merchant/menu/new')}>Sửa</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default MerchantMenu;