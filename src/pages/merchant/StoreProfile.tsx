import React from 'react';
import { Box, Card, CardContent, CardHeader, Avatar, Grid, TextField, Button, Typography, Stack } from '@mui/material';
import { useMerchantSession } from '../../store/merchantSession';

const StoreProfile: React.FC = () => {
  const { currentStore } = useMerchantSession();

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Store Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Cập nhật thông tin cửa hàng của bạn (logo, mô tả, địa chỉ, liên hệ).
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>{(currentStore?.name || 'S')[0]}</Avatar>}
          title={currentStore?.name || 'Your Store'}
          subheader={`Role: ${currentStore?.role || 'MANAGER'}`}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Tên cửa hàng" defaultValue={currentStore?.name || ''} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Số điện thoại" placeholder="0123 456 789" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Mô tả" multiline minRows={3} placeholder="Mô tả ngắn về cửa hàng..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Địa chỉ" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Website" placeholder="https://" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email liên hệ" placeholder="store@example.com" />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" color="primary">Lưu thay đổi</Button>
            <Button variant="outlined" color="secondary">Tải lại</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StoreProfile;