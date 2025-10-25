import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Stack, Button } from '@mui/material';
import { useParams } from 'react-router-dom';

const StoreDetail: React.FC = () => {
  const { id } = useParams();

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Store Detail — {id}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Chi tiết cửa hàng, trạng thái, người quản lý, thông tin liên hệ.
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Tên cửa hàng</Typography>
              <Typography variant="body1">Fastfood Sample Store</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Trạng thái</Typography>
              <Chip label="ACTIVE" color="success" size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Quản lý</Typography>
              <Typography variant="body1">Nguyễn Văn A</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Email liên hệ</Typography>
              <Typography variant="body1">store@example.com</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Địa chỉ</Typography>
              <Typography variant="body1">123, Nguyễn Trãi, Thanh Xuân, Hà Nội</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" color="warning">Suspend</Button>
        <Button variant="outlined" color="success">Activate</Button>
        <Button variant="outlined">Transfer Manager</Button>
      </Stack>
    </Box>
  );
};

export default StoreDetail;