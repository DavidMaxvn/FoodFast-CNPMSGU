import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Tabs,
  Tab,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Search, Visibility, CheckCircle, LocalShipping, Restaurant, Cancel } from '@mui/icons-material';
import { useMerchantSession } from '../../store/merchantSession';
import { getOrdersByStatus, updateOrderStatus, getOrderById, OrderResponse, Page, OrderDTO } from '../../services/order';

// Order status types aligned with backend
type OrderStatus = 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

const statusConfig: Record<OrderStatus, { label: string; color: 'default' | 'info' | 'warning' | 'primary' | 'success' | 'error'; icon: React.ReactNode }> = {
  CREATED: { label: 'Mới tạo', color: 'default', icon: <CheckCircle /> },
  CONFIRMED: { label: 'Đã xác nhận', color: 'info', icon: <CheckCircle /> },
  PREPARING: { label: 'Đang chuẩn bị', color: 'warning', icon: <Restaurant /> },
  READY: { label: 'Sẵn sàng giao', color: 'info', icon: <LocalShipping /> },
  DELIVERING: { label: 'Đang giao', color: 'primary', icon: <LocalShipping /> },
  COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircle /> },
  CANCELLED: { label: 'Đã hủy', color: 'error', icon: <Cancel /> },
};

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  CREATED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'DELIVERING',
  DELIVERING: 'COMPLETED',
};

// Map UI status <-> backend status
const uiToBackendStatus: Record<OrderStatus, string> = {
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY_FOR_DELIVERY',
  DELIVERING: 'OUT_FOR_DELIVERY',
  COMPLETED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};
const backendToUIStatus: Record<string, OrderStatus> = {
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY_FOR_DELIVERY: 'READY',
  ASSIGNED: 'READY',
  OUT_FOR_DELIVERY: 'DELIVERING',
  DELIVERED: 'COMPLETED',
  REJECTED: 'CANCELLED',
  CANCELLED: 'CANCELLED',
  FAILED: 'CANCELLED',
};

const MerchantOrders: React.FC = () => {
  const { currentStore } = useMerchantSession();
  const [selectedTab, setSelectedTab] = useState<number>(0); // 0: CREATED -> 5: CANCELLED
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<Page<OrderResponse> | null>(null);
  const [loading, setLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentStatus: OrderStatus = useMemo(() => (
    ['CREATED','CONFIRMED','PREPARING','READY','DELIVERING','COMPLETED','CANCELLED'][selectedTab] as OrderStatus
  ), [selectedTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getOrdersByStatus(uiToBackendStatus[currentStatus], page, size);
      setData(res);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [currentStatus, page, size]);

  const openDetails = async (o: OrderResponse) => { 
    setSelectedOrder(o); 
    setDetailOpen(true);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const detail: OrderDTO = await getOrderById(0, o.id);
      const items = (detail.orderItems || []).map((it) => ({
        id: Number(it.id),
        menuItemId: it.menuItem?.id,
        menuItemName: it.menuItem?.name || 'Sản phẩm',
        quantity: Number(it.quantity || 0),
        unitPrice: Number(it.unitPrice ?? it.menuItem?.price ?? 0),
      }));
      setSelectedOrder((prev) => prev ? { ...prev, items } : { ...o, items });
    } catch (e: any) {
      setDetailError(e?.response?.data?.message || 'Không tải được chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };
  const closeDetails = () => { setDetailOpen(false); setSelectedOrder(null); };

  // Tính trạng thái backend tiếp theo dựa trên trạng thái backend hiện tại
  const computeNextBackendStatus = (backendStatus: string): string | null => {
    switch (backendStatus) {
      case 'CREATED': return 'CONFIRMED';
      case 'CONFIRMED': return 'PREPARING';
      case 'PREPARING': return 'READY_FOR_DELIVERY';
      case 'READY_FOR_DELIVERY': return 'OUT_FOR_DELIVERY';
      case 'ASSIGNED': return 'OUT_FOR_DELIVERY';
      case 'OUT_FOR_DELIVERY': return 'DELIVERED';
      default: return null;
    }
  };

  const handleAdvanceStatus = async (o: OrderResponse) => {
    const target = computeNextBackendStatus(o.status as any);
    if (!target) return;
    try {
      await updateOrderStatus(o.id, target);
      const uiKey = backendToUIStatus[target];
      setSuccessMessage(`Đơn #${o.id} đã chuyển sang "${statusConfig[uiKey].label}"`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchData();
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.message || 'Cập nhật trạng thái thất bại');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  const filteredContent = useMemo(() => {
    const list = data?.content || [];
    if (!searchTerm) return list;
    return list.filter(o => String(o.id).includes(searchTerm.trim()));
  }, [data, searchTerm]);


  return (
  <Box sx={{ py: 4 }}>
    <Typography variant="h4" fontWeight={800} gutterBottom>
      Đơn hàng cửa hàng: {currentStore?.name || 'Cửa hàng của bạn'}
    </Typography>
    {showSuccess && (
      <Alert severity="success" sx={{ mb: 2 }} onClose={() => setShowSuccess(false)}>{successMessage}</Alert>
    )}
    {showError && (
      <Alert severity="error" sx={{ mb: 2 }} onClose={() => setShowError(false)}>{errorMessage}</Alert>
    )}
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          placeholder="Tìm theo mã đơn (ID)"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>) }}
          fullWidth
        />
      </Stack>
      <Tabs value={selectedTab} onChange={(_, v) => { setSelectedTab(v); setPage(0); }} variant="scrollable" sx={{ mt: 2 }}>
        <Tab label={statusConfig.CREATED.label} />
        <Tab label={statusConfig.CONFIRMED.label} />
        <Tab label={statusConfig.PREPARING.label} />
        <Tab label={statusConfig.READY.label} />
        <Tab label={statusConfig.DELIVERING.label} />
        <Tab label={statusConfig.COMPLETED.label} />
        <Tab label={statusConfig.CANCELLED.label} />
      </Tabs>
    </Paper>

    <Paper>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Mã đơn</TableCell>
            <TableCell>Thanh toán</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Thời gian</TableCell>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredContent.map((o) => (
            <TableRow key={o.id} hover>
              <TableCell>{o.id}</TableCell>
              <TableCell>
                <Chip size="small" label={(o.paymentStatus || 'PENDING').toUpperCase()} color={(o.paymentStatus === 'PAID' ? 'success' : o.paymentStatus === 'FAILED' ? 'error' : 'warning') as any} />
              </TableCell>
              <TableCell>
                <Chip size="small" label={statusConfig[backendToUIStatus[o.status as any]].label} color={statusConfig[backendToUIStatus[o.status as any]].color as any} />
              </TableCell>
              <TableCell>{o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '-'}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <IconButton size="small" color="info" onClick={() => openDetails(o)}><Visibility /></IconButton>
                  {nextStatusMap[backendToUIStatus[o.status as any]] && (
                    <IconButton size="small" color="primary" onClick={() => handleAdvanceStatus(o)}>
                      {statusConfig[nextStatusMap[backendToUIStatus[o.status as any]]!].icon}
                    </IconButton>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {(filteredContent.length === 0 && !loading) && (
            <TableRow>
              <TableCell colSpan={5} align="center">Không có dữ liệu</TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </Paper>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <TextField
          label="Trang"
          type="number"
          size="small"
          value={page + 1}
          onChange={(e) => setPage(Math.max(0, Number(e.target.value) - 1))}
          sx={{ width: 100 }}
        />
        <TextField
          label="Kích thước"
          type="number"
          size="small"
          value={size}
          onChange={(e) => { setSize(Math.max(1, Number(e.target.value))); setPage(0); }}
          sx={{ width: 120 }}
        />
        <Typography color="text.secondary">
          Tổng: {data?.totalElements || 0} • Trang {page + 1}/{data?.totalPages || 0}
        </Typography>
      </Stack>

      <Dialog open={detailOpen} onClose={closeDetails} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Stack spacing={2}>
              <Typography>Trạng thái: {statusConfig[backendToUIStatus[selectedOrder.status as any]].label}</Typography>
              <Typography>Thanh toán: {(selectedOrder.paymentStatus || 'PENDING').toUpperCase()} ({selectedOrder.paymentMethod || 'COD'})</Typography>
              <Typography>Thời gian: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN') : '-'}</Typography>
              <Typography sx={{ fontWeight: 600 }}>Món:</Typography>
              {detailLoading && <Typography color="text.secondary">Đang tải chi tiết...</Typography>}
              {detailError && <Typography color="error">{detailError}</Typography>}
              {!detailLoading && !detailError && (
                <Paper sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                  <Box>
                    {(selectedOrder.items || []).map((it) => (
                      <Stack key={it.id} direction="row" justifyContent="space-between" sx={{ py: 0.75 }}>
                        <Typography>{it.menuItemName || `Item ${it.menuItemId}`}</Typography>
                        <Typography>x{it.quantity} • {(it.unitPrice || 0).toLocaleString('vi-VN')} VND</Typography>
                      </Stack>
                    ))}
                  </Box>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Đóng</Button>
          {selectedOrder && nextStatusMap[backendToUIStatus[selectedOrder.status as any]] && (
            <Button variant="contained" onClick={() => handleAdvanceStatus(selectedOrder!)}>Chuyển trạng thái</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MerchantOrders;