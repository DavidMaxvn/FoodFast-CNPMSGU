import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, Stack } from '@mui/material';

/**
 * M07 - Category Management (Mock)
 * - TODO: Gọi API danh mục món: thêm/sửa/xóa (sau)
 * - Hiện hiển thị danh sách giả.
 */
interface Category { id: number; name: string; }

const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Burgers' },
  { id: 2, name: 'Chicken' },
  { id: 3, name: 'Drinks' },
  { id: 4, name: 'Sides' },
];

const MerchantCategories: React.FC = () => {
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    // TODO: Gọi API lấy danh sách danh mục (sau)
    setCats(MOCK_CATEGORIES);
  }, []);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Danh mục món</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained">Thêm danh mục</Button>
        <Button variant="outlined">Sửa danh mục</Button>
      </Stack>
      <List>
        {cats.map((c) => (
          <ListItem key={c.id}>
            <ListItemText primary={c.name} secondary={`ID: ${c.id}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MerchantCategories;