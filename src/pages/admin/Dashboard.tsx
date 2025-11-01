import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Alert,
  AlertTitle,
  Stack,
  Button
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  LocalShipping,
  AttachMoney,
  Restaurant,
  Warning,
  CheckCircle,
  Schedule,
  Visibility,
  Refresh,
  LocalOffer,
  Store,
  Star,
  Timeline
} from '@mui/icons-material';

// Mock data types
interface KPIData {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

interface RecentOrder {
  id: string;
  customerName: string;
  items: string;
  total: number;
  status: 'pending' | 'preparing' | 'delivering' | 'completed';
  time: string;
  paymentMethod: string;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  orders: number;
  revenue: number;
  rating: number;
  trend: number;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'delivery' | 'customer' | 'alert';
  message: string;
  time: string;
  icon: React.ReactElement;
  color: string;
}

interface ChartDataPoint {
  day: string;
  revenue: number;
  orders: number;
}

// Mock data for KPIs
const kpiData: KPIData[] = [
  { 
    title: 'Total Revenue', 
    value: '$45,287', 
    icon: <AttachMoney />, 
    change: '+12.5%', 
    trend: 'up',
    color: 'success'
  },
  { 
    title: 'Orders Today', 
    value: 246, 
    icon: <ShoppingCart />, 
    change: '+8.2%', 
    trend: 'up',
    color: 'primary'
  },
  { 
    title: 'Active Deliveries', 
    value: 38, 
    icon: <LocalShipping />, 
    change: '+15.3%', 
    trend: 'up',
    color: 'info'
  },
  { 
    title: 'New Customers', 
    value: 124, 
    icon: <People />, 
    change: '+5.7%', 
    trend: 'up',
    color: 'success'
  },
  { 
    title: 'Avg. Order Value', 
    value: '$34.50', 
    icon: <TrendingUp />, 
    change: '-2.1%', 
    trend: 'down',
    color: 'warning'
  },
  { 
    title: 'Customer Rating', 
    value: '4.8/5', 
    icon: <Star />, 
    change: '+0.2', 
    trend: 'up',
    color: 'warning'
  }
];

// Mock data for recent orders
const recentOrders: RecentOrder[] = [
  { 
    id: 'ORD-2024-001', 
    customerName: 'Nguyễn Văn A', 
    items: '2x Burger Deluxe, 1x Fries', 
    total: 28.50, 
    status: 'completed',
    time: '5 mins ago',
    paymentMethod: 'Card'
  },
  { 
    id: 'ORD-2024-002', 
    customerName: 'Trần Thị B', 
    items: '1x Pizza Margherita, 2x Coke', 
    total: 45.00, 
    status: 'delivering',
    time: '12 mins ago',
    paymentMethod: 'Cash'
  },
  { 
    id: 'ORD-2024-003', 
    customerName: 'Lê Văn C', 
    items: '3x Chicken Wings, 1x Salad', 
    total: 32.75, 
    status: 'preparing',
    time: '18 mins ago',
    paymentMethod: 'E-Wallet'
  },
  { 
    id: 'ORD-2024-004', 
    customerName: 'Phạm Thị D', 
    items: '1x Sushi Set, 2x Green Tea', 
    total: 55.00, 
    status: 'pending',
    time: '23 mins ago',
    paymentMethod: 'Card'
  },
  { 
    id: 'ORD-2024-005', 
    customerName: 'Hoàng Văn E', 
    items: '2x Ramen Bowl, 1x Dumplings', 
    total: 38.90, 
    status: 'preparing',
    time: '28 mins ago',
    paymentMethod: 'Card'
  }
];

// Mock data for top products
const topProducts: TopProduct[] = [
  { 
    id: '1', 
    name: 'Burger Deluxe', 
    category: 'Burgers', 
    orders: 156, 
    revenue: 2340, 
    rating: 4.8,
    trend: 12
  },
  { 
    id: '2', 
    name: 'Pizza Margherita', 
    category: 'Pizza', 
    orders: 132, 
    revenue: 5940, 
    rating: 4.9,
    trend: 8
  },
  { 
    id: '3', 
    name: 'Chicken Wings', 
    category: 'Chicken', 
    orders: 98, 
    revenue: 1470, 
    rating: 4.7,
    trend: -3
  },
  { 
    id: '4', 
    name: 'Sushi Set', 
    category: 'Japanese', 
    orders: 87, 
    revenue: 4785, 
    rating: 4.9,
    trend: 15
  },
  { 
    id: '5', 
    name: 'Ramen Bowl', 
    category: 'Japanese', 
    orders: 76, 
    revenue: 1520, 
    rating: 4.6,
    trend: 5
  }
];

// Mock data for chart (7 days)
const chartData: ChartDataPoint[] = [
  { day: 'Mon', revenue: 4250, orders: 145 },
  { day: 'Tue', revenue: 5100, orders: 167 },
  { day: 'Wed', revenue: 4800, orders: 156 },
  { day: 'Thu', revenue: 6200, orders: 198 },
  { day: 'Fri', revenue: 7500, orders: 234 },
  { day: 'Sat', revenue: 8900, orders: 276 },
  { day: 'Sun', revenue: 8537, orders: 246 }
];

// Mock data for recent activities
const recentActivities: ActivityItem[] = [
  { 
    id: '1', 
    type: 'order', 
    message: 'New order #ORD-2024-001 received', 
    time: '2 mins ago',
    icon: <ShoppingCart />,
    color: '#1976d2'
  },
  { 
    id: '2', 
    type: 'delivery', 
    message: 'Order #ORD-2024-098 delivered successfully', 
    time: '8 mins ago',
    icon: <CheckCircle />,
    color: '#2e7d32'
  },
  { 
    id: '3', 
    type: 'customer', 
    message: 'New customer registered: Nguyễn Văn A', 
    time: '15 mins ago',
    icon: <People />,
    color: '#9c27b0'
  },
  { 
    id: '4', 
    type: 'alert', 
    message: 'Low stock alert: French Fries', 
    time: '32 mins ago',
    icon: <Warning />,
    color: '#ed6c02'
  },
  { 
    id: '5', 
    type: 'delivery', 
    message: 'Drone #DRN-003 started delivery', 
    time: '45 mins ago',
    icon: <LocalShipping />,
    color: '#0288d1'
  }
];

const Dashboard: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdate(new Date());
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'delivering':
        return 'primary';
      case 'preparing':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'Hoàn thành';
      case 'DELIVERING':
      case 'OUT_FOR_DELIVERY':
        return 'Đang giao';
      case 'PREPARING':
        return 'Đang chuẩn bị';
      case 'READY':
      case 'READY_FOR_DELIVERY':
        return 'Sẵn sàng giao';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'CREATED':
        return 'Mới tạo';
      case 'PENDING':
        return 'Chờ xử lý';
      case 'CANCELLED':
      case 'REJECTED':
      case 'FAILED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
  const maxOrders = Math.max(...chartData.map(d => d.orders));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 0.5 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <Refresh className="rotating" /> : <Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* System Alerts */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Alert severity="warning" icon={<Warning />}>
          <AlertTitle>Low Stock Alert</AlertTitle>
          3 items are running low on stock. Check inventory management.
        </Alert>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Paper 
              elevation={2} 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${
                  kpi.color === 'success' ? '#e8f5e9' : 
                  kpi.color === 'warning' ? '#fff3e0' : 
                  kpi.color === 'error' ? '#ffebee' : 
                  kpi.color === 'info' ? '#e3f2fd' : '#f3e5f5'
                } 0%, white 100%)`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 'none' }}>
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: kpi.color === 'success' ? 'success.main' : 
                                 kpi.color === 'warning' ? 'warning.main' : 
                                 kpi.color === 'error' ? 'error.main' : 
                                 kpi.color === 'info' ? 'info.main' : 'primary.main',
                        width: 48, 
                        height: 48 
                      }}
                    >
                      {kpi.icon}
                    </Avatar>
                    <Chip 
                      label={kpi.change}
                      size="small"
                      color={kpi.trend === 'up' ? 'success' : kpi.trend === 'down' ? 'error' : 'default'}
                      icon={kpi.trend === 'up' ? <TrendingUp fontSize="small" /> : kpi.trend === 'down' ? <TrendingDown fontSize="small" /> : undefined}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {kpi.title}
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                    {kpi.value}
                  </Typography>
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Revenue Overview Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline color="primary" />
                Revenue Overview (Last 7 Days)
              </Typography>
              <Chip label="Weekly" color="primary" size="small" />
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {/* Simple Bar Chart using CSS */}
            <Box sx={{ height: 300 }}>
              {chartData.map((data, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {data.day}
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                      ${data.revenue.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(data.revenue / maxRevenue) * 100}
                        sx={{ 
                          height: 20, 
                          borderRadius: 2,
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 2,
                            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, textAlign: 'right' }}>
                      {data.orders} orders
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Summary Stats */}
            <Box sx={{ display: 'flex', gap: 4, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                  ${chartData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                  {chartData.reduce((sum, d) => sum + d.orders, 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Avg. Daily</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ${(chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length).toFixed(0)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Top Selling Items */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalOffer color="warning" />
              Top Selling Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ pt: 0 }}>
              {topProducts.map((product, index) => (
                <ListItem 
                  key={product.id}
                  sx={{ 
                    px: 0,
                    py: 1.5,
                    borderBottom: index < topProducts.length - 1 ? 1 : 0,
                    borderColor: 'divider'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'grey.300',
                        color: index < 3 ? 'white' : 'text.secondary',
                        fontWeight: 600
                      }}
                    >
                      #{index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {product.name}
                        </Typography>
                        <Chip 
                          label={`${product.trend > 0 ? '+' : ''}${product.trend}%`}
                          size="small"
                          color={product.trend > 0 ? 'success' : 'error'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {product.orders} orders
                          </Typography>
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                            ${product.revenue.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                          <Typography variant="caption">{product.rating}</Typography>
                          <Typography variant="caption" color="text.secondary">• {product.category}</Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Orders and Activities */}
      <Grid container spacing={3}>
        {/* Recent Orders Table */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCart color="primary" />
                Recent Orders
              </Typography>
              <Button size="small" endIcon={<Visibility />}>View All</Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                          {order.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                          {order.items}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          ${order.total.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={order.paymentMethod} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(order.status)}
                          size="small"
                          color={getStatusColor(order.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {order.time}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="info" />
              Recent Activities
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ pt: 0 }}>
              {recentActivities.map((activity) => (
                <ListItem 
                  key={activity.id}
                  sx={{ px: 0, py: 1.5 }}
                >
                  <ListItemAvatar>
                    <Badge 
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: activity.color,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          border: '2px solid white'
                        }
                      }}
                    >
                      <Avatar sx={{ bgcolor: activity.color, width: 36, height: 36 }}>
                        {React.cloneElement(activity.icon, { sx: { fontSize: 20 } })}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {activity.message}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* CSS for rotating animation */}
      <style>
        {`
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .rotating {
            animation: rotate 1s linear infinite;
          }
        `}
      </style>
    </Box>
  );
};

export default Dashboard;