import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';

/**
 * M02 - Dashboard (Mock)
 * - TODO: Gọi API thống kê nhanh: đơn hôm nay, doanh thu, phản hồi (sau)
 * - Hiện tại hiển thị số liệu giả.
 */
const stats = [
  { label: 'Đơn hôm nay', value: 42 },
  { label: 'Doanh thu ($)', value: 12500000 },
  { label: 'Phản hồi mới', value: 8 },
];

const MerchantDashboard: React.FC = () => {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={2}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={4} key={s.label}>
            <Card>
              <CardContent>
                <Typography variant="h6">{s.label}</Typography>
                <Typography variant="h4" fontWeight={700}>${s.value.toLocaleString('en-US')}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MerchantDashboard;