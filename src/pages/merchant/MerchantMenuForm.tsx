import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Button, MenuItem } from '@mui/material';

/**
 * M06 - Menu Form (Mock)
 * - TODO: Gọi API thêm/sửa món (sau). Nếu có id -> chế độ sửa.
 * - Hiện tại chỉ mock form nhập và log dữ liệu.
 */
const categories = ['Burgers', 'Chicken', 'Drinks', 'Sides'];

const MerchantMenuForm: React.FC = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState(categories[0]);
  const [imageUrl, setImageUrl] = useState('');

  const onSubmit = () => {
    // TODO: Gọi API lưu món (sau)
    console.log({ name, price, category, imageUrl });
    alert('Mock: Đã gửi form (xem console).');
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Thêm/Sửa món</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Tên món" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Giá" type="number" fullWidth value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select label="Danh mục" fullWidth value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Ảnh (URL)" fullWidth value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" onClick={onSubmit}>Lưu</Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MerchantMenuForm;