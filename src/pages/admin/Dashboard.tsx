import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  People,
  LocalShipping,
  AttachMoney,
  Restaurant
} from '@mui/icons-material';

// Mock data for dashboard
const kpiData = [
  { title: 'Total Revenue', value: '$12,543', icon: <AttachMoney color="primary" />, change: '+12%' },
  { title: 'Orders Today', value: '156', icon: <ShoppingCart color="primary" />, change: '+8%' },
  { title: 'Active Deliveries', value: '24', icon: <LocalShipping color="primary" />, change: '+15%' },
  { title: 'New Customers', value: '38', icon: <People color="primary" />, change: '+5%' },
  { title: 'Popular Items', value: 'Burgers', icon: <Restaurant color="primary" />, change: 'Steady' },
  { title: 'Avg. Order Value', value: '$28.45', icon: <TrendingUp color="primary" />, change: '+3%' }
];

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper elevation={2} sx={{ height: '100%' }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  avatar={kpi.icon}
                  title={kpi.title}
                  titleTypographyProps={{ variant: 'subtitle1' }}
                />
                <CardContent sx={{ pt: 0, flexGrow: 1 }}>
                  <Typography variant="h4" component="div" gutterBottom>
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {kpi.change} from last week
                  </Typography>
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Revenue Overview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Revenue Chart (Will be implemented with real chart library)
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Top Selling Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Top Items Chart (Will be implemented with real chart library)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Recent Orders Table (Will be implemented with real data table)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;