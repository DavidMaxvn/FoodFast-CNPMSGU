import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import {
  Search,
  Visibility,
  CheckCircle,
  LocalShipping,
  Restaurant,
  Cancel,
  Refresh,
  FilterList,
  Receipt,
  AccessTime,
  Person,
  Phone,
  LocationOn,
  Payment
} from '@mui/icons-material';

// Order status types
type OrderStatus = 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

// Mock data structure
interface OrderItem {
  id: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

interface Order {
  id: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  note?: string;
  items: OrderItem[];
  storeName: string;
}

// Mock orders data
const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    orderCode: 'ORD-2025-001',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    customerAddress: '123 Lê Lợi, Quận 1, TP.HCM',
    status: 'CREATED',
    totalAmount: 250000,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    createdAt: '2025-10-20T10:30:00',
    updatedAt: '2025-10-20T10:30:00',
    note: 'Gọi trước 5 phút',
    storeName: 'Downtown Store',
    items: [
      { id: 1, menuItemName: 'Classic Burger', quantity: 2, unitPrice: 85000, imageUrl: '/uploads/products/burger.jpg' },
      { id: 2, menuItemName: 'French Fries', quantity: 2, unitPrice: 40000, imageUrl: '/uploads/products/fries.jpg' }
    ]
  },
  {
    id: 2,
    orderCode: 'ORD-2025-002',
    customerName: 'Trần Thị B',
    customerPhone: '0907654321',
    customerAddress: '456 Nguyễn Huệ, Quận 1, TP.HCM',
    status: 'CONFIRMED',
    totalAmount: 180000,
    paymentMethod: 'VNPAY',
    paymentStatus: 'PAID',
    createdAt: '2025-10-20T09:15:00',
    updatedAt: '2025-10-20T09:20:00',
    storeName: 'Downtown Store',
    items: [
      { id: 3, menuItemName: 'Fried Chicken', quantity: 1, unitPrice: 120000 },
      { id: 4, menuItemName: 'Coca Cola', quantity: 2, unitPrice: 30000 }
    ]
  },
  {
    id: 3,
    orderCode: 'ORD-2025-003',
    customerName: 'Lê Văn C',
    customerPhone: '0912345678',
    customerAddress: '789 Pasteur, Quận 3, TP.HCM',
    status: 'PREPARING',
    totalAmount: 320000,
    paymentMethod: 'VNPAY',
    paymentStatus: 'PAID',
    createdAt: '2025-10-20T08:45:00',
    updatedAt: '2025-10-20T09:00:00',
    note: 'Không hành',
    storeName: 'Uptown Store',
    items: [
      { id: 5, menuItemName: 'Pizza', quantity: 1, unitPrice: 200000 },
      { id: 6, menuItemName: 'Chicken Wings', quantity: 1, unitPrice: 120000 }
    ]
  },
  {
    id: 4,
    orderCode: 'ORD-2025-004',
    customerName: 'Phạm Thị D',
    customerPhone: '0923456789',
    customerAddress: '321 Võ Văn Tần, Quận 3, TP.HCM',
    status: 'DELIVERING',
    totalAmount: 195000,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    createdAt: '2025-10-20T08:00:00',
    updatedAt: '2025-10-20T08:45:00',
    storeName: 'Downtown Store',
    items: [
      { id: 7, menuItemName: 'Cheeseburger', quantity: 2, unitPrice: 95000 },
      { id: 8, menuItemName: 'Ice Cream', quantity: 1, unitPrice: 50000 }
    ]
  },
  {
    id: 5,
    orderCode: 'ORD-2025-005',
    customerName: 'Hoàng Văn E',
    customerPhone: '0934567890',
    customerAddress: '654 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
    status: 'COMPLETED',
    totalAmount: 275000,
    paymentMethod: 'VNPAY',
    paymentStatus: 'PAID',
    createdAt: '2025-10-20T07:00:00',
    updatedAt: '2025-10-20T08:15:00',
    storeName: 'Uptown Store',
    items: [
      { id: 9, menuItemName: 'Classic Burger', quantity: 3, unitPrice: 85000 },
      { id: 10, menuItemName: 'Coca Cola', quantity: 1, unitPrice: 30000 }
    ]
  },
  {
    id: 6,
    orderCode: 'ORD-2025-006',
    customerName: 'Võ Thị F',
    customerPhone: '0945678901',
    customerAddress: '987 Cộng Hòa, Quận Tân Bình, TP.HCM',
    status: 'CANCELLED',
    totalAmount: 150000,
    paymentMethod: 'COD',
    paymentStatus: 'FAILED',
    createdAt: '2025-10-20T06:30:00',
    updatedAt: '2025-10-20T06:45:00',
    note: 'Khách hủy đơn',
    storeName: 'Downtown Store',
    items: [
      { id: 11, menuItemName: 'Fried Chicken', quantity: 1, unitPrice: 120000 },
      { id: 12, menuItemName: 'French Fries', quantity: 1, unitPrice: 40000 }
    ]
  }
];

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(MOCK_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterStore, setFilterStore] = useState<string>('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Status configuration
  const statusConfig: Record<OrderStatus, { label: string; color: any; icon: any }> = {
    CREATED: { label: 'Mới tạo', color: 'default', icon: <Receipt /> },
    CONFIRMED: { label: 'Đã xác nhận', color: 'info', icon: <CheckCircle /> },
    PREPARING: { label: 'Đang chuẩn bị', color: 'warning', icon: <Restaurant /> },
    DELIVERING: { label: 'Đang giao', color: 'primary', icon: <LocalShipping /> },
    COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircle /> },
    CANCELLED: { label: 'Đã hủy', color: 'error', icon: <Cancel /> }
  };

  // Calculate statistics
  const stats = {
    total: orders.length,
    created: orders.filter(o => o.status === 'CREATED').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    delivering: orders.filter(o => o.status === 'DELIVERING').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    revenue: orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.totalAmount, 0),
    pending: orders.filter(o => ['CREATED', 'CONFIRMED', 'PREPARING', 'DELIVERING'].includes(o.status)).length
  };

  // Get unique stores
  const stores = Array.from(new Set(orders.map(o => o.storeName)));

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm)
      );
    }

    // Filter by status tab
    const statusMap: Record<number, OrderStatus[]> = {
      0: ['CREATED', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'], // All
      1: ['CREATED'],
      2: ['CONFIRMED'],
      3: ['PREPARING'],
      4: ['DELIVERING'],
      5: ['COMPLETED'],
      6: ['CANCELLED']
    };
    
    if (statusMap[selectedTab]) {
      filtered = filtered.filter(order => statusMap[selectedTab].includes(order.status));
    }

    // Filter by store
    if (filterStore !== 'all') {
      filtered = filtered.filter(order => order.storeName === filterStore);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, selectedTab, filterStore, orders]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatus = (orderId: number, newStatus: OrderStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        : order
    );
    setOrders(updatedOrders);
    setSuccessMessage(`Đã cập nhật trạng thái đơn hàng thành ${statusConfig[newStatus].label}`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      CREATED: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'DELIVERING',
      DELIVERING: 'COMPLETED',
      COMPLETED: null,
      CANCELLED: null
    };
    return flow[currentStatus];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Order Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => setOrders([...MOCK_ORDERS])}
        >
          Refresh
        </Button>
      </Box>

      {/* Success Alert */}
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setShowSuccess(false)}>
          {successMessage}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">Tổng đơn hàng</Typography>
                  <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
                </Box>
                <Receipt sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">Đang xử lý</Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.pending}</Typography>
                </Box>
                <AccessTime sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">Hoàn thành</Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{stats.completed}</Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">Doanh thu</Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {formatCurrency(stats.revenue)}
                  </Typography>
                </Box>
                <Payment sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo mã đơn, tên khách, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Cửa hàng</InputLabel>
            <Select
              value={filterStore}
              label="Cửa hàng"
              onChange={(e: SelectChangeEvent) => setFilterStore(e.target.value)}
              startAdornment={<FilterList sx={{ mr: 1, color: 'action.active' }} />}
            >
              <MenuItem value="all">Tất cả cửa hàng</MenuItem>
              {stores.map(store => (
                <MenuItem key={store} value={store}>{store}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} variant="scrollable">
          <Tab label={`Tất cả (${stats.total})`} />
          <Tab label={<Badge badgeContent={stats.created} color="default">Mới tạo</Badge>} />
          <Tab label={<Badge badgeContent={stats.confirmed} color="info">Đã xác nhận</Badge>} />
          <Tab label={<Badge badgeContent={stats.preparing} color="warning">Đang chuẩn bị</Badge>} />
          <Tab label={<Badge badgeContent={stats.delivering} color="primary">Đang giao</Badge>} />
          <Tab label={<Badge badgeContent={stats.completed} color="success">Hoàn thành</Badge>} />
          <Tab label={<Badge badgeContent={stats.cancelled} color="error">Đã hủy</Badge>} />
        </Tabs>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Cửa hàng</TableCell>
              <TableCell>Số tiền</TableCell>
              <TableCell>Thanh toán</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status];
              const nextStatus = getNextStatus(order.status);

              return (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {order.orderCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {order.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.customerPhone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{order.storeName}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formatCurrency(order.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Chip
                        label={order.paymentMethod}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={order.paymentStatus}
                        size="small"
                        color={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'FAILED' ? 'error' : 'warning'}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={config.label}
                      color={config.color}
                      icon={config.icon}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDateTime(order.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {nextStatus && (
                        <Tooltip title={`Chuyển sang ${statusConfig[nextStatus].label}`}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleUpdateStatus(order.id, nextStatus)}
                          >
                            {statusConfig[nextStatus].icon}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    Không tìm thấy đơn hàng nào
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Chi tiết đơn hàng</Typography>
            {selectedOrder && (
              <Chip
                label={statusConfig[selectedOrder.status].label}
                color={statusConfig[selectedOrder.status].color}
                icon={statusConfig[selectedOrder.status].icon}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Grid container spacing={3}>
              {/* Order Info */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Thông tin đơn hàng
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Receipt fontSize="small" />
                      <Typography variant="body2">
                        <strong>Mã đơn:</strong> {selectedOrder.orderCode}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime fontSize="small" />
                      <Typography variant="body2">
                        <strong>Thời gian:</strong> {formatDateTime(selectedOrder.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Payment fontSize="small" />
                      <Typography variant="body2">
                        <strong>Thanh toán:</strong> {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Customer Info */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Thông tin khách hàng
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" />
                      <Typography variant="body2">
                        <strong>Tên:</strong> {selectedOrder.customerName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" />
                      <Typography variant="body2">
                        <strong>SĐT:</strong> {selectedOrder.customerPhone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocationOn fontSize="small" />
                      <Typography variant="body2">
                        <strong>Địa chỉ:</strong> {selectedOrder.customerAddress}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Order Items */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Chi tiết món ăn
                </Typography>
                <List>
                  {selectedOrder.items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem>
                        <Avatar
                          src={item.imageUrl}
                          alt={item.menuItemName}
                          sx={{ mr: 2 }}
                          variant="rounded"
                        />
                        <ListItemText
                          primary={item.menuItemName}
                          secondary={`${formatCurrency(item.unitPrice)} x ${item.quantity}`}
                        />
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </Typography>
                      </ListItem>
                      {index < selectedOrder.items.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Grid>

              {/* Note */}
              {selectedOrder.note && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <strong>Ghi chú:</strong> {selectedOrder.note}
                  </Alert>
                </Grid>
              )}

              {/* Total */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Tổng cộng</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Đóng</Button>
          {selectedOrder && getNextStatus(selectedOrder.status) && (
            <Button
              variant="contained"
              onClick={() => {
                const nextStatus = getNextStatus(selectedOrder.status);
                if (nextStatus) {
                  handleUpdateStatus(selectedOrder.id, nextStatus);
                  handleCloseDialog();
                }
              }}
            >
              Chuyển sang {statusConfig[getNextStatus(selectedOrder.status)!].label}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderManagement;
