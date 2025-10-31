import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  SvgIcon
} from '@mui/material';
import {
  RestaurantMenu,
  CheckCircle,
  LocalShipping,
  Kitchen,
  FlightTakeoff,
  TravelExplore
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import TrackingMap from '../components/TrackingMap';
import api from '../services/api';

// Order status steps
const steps = ['Confirmed', 'Preparing', 'Ready for Delivery', 'Drone Delivery', 'Delivered'];
const statusToStep = {
  confirmed: 0,
  preparing: 1,
  ready: 2,
  delivering: 3,
  delivered: 4
} as const;

type StatusKey = keyof typeof statusToStep;

const backendToUIStatus: Record<string, StatusKey> = {
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_DELIVERY: 'ready',
  ASSIGNED: 'ready',
  OUT_FOR_DELIVERY: 'delivering',
  DELIVERED: 'delivered',
  // Fallbacks for early states
  CREATED: 'confirmed',
  PENDING_PAYMENT: 'confirmed',
  PAID: 'confirmed',
};

// Simple custom drone icon using SVG
const DroneIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <circle cx="4.5" cy="4.5" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
    <circle cx="19.5" cy="4.5" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
    <circle cx="4.5" cy="19.5" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
    <circle cx="19.5" cy="19.5" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
    <path d="M6 6 L10 10 M18 6 L14 10 M6 18 L10 14 M18 18 L14 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </SvgIcon>
);

interface OrderItemUI {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderUI {
  id: number | string;
  status: StatusKey;
  items: OrderItemUI[];
  total: number;
  deliveryFee: number;
  address: string;
  estimatedDelivery: string;
  paymentMethod: string;
  paymentStatus?: string;
}

const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const auth = useSelector((state: RootState) => state.auth);
  const userId = auth.user ? Number(auth.user.id) : null;

  const [order, setOrder] = useState<OrderUI | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isArrivingSoon, setIsArrivingSoon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderFromAPI = async (orderId: string) => {
      try {
        console.log('Loading order from API, orderId:', orderId);
        const response = await api.get(`/orders/${orderId}`);
        const raw = response.data;
        console.log('API response:', raw);
        
        const statusRaw = (raw.status || '').toString().toUpperCase();
        const uiStatus: StatusKey = backendToUIStatus[statusRaw] || 'confirmed';
        
        // Handle address properly - it might be a string or object
        let address = 'N/A';
        if (typeof raw.address === 'string') {
          address = raw.address;
        } else if (raw.address && typeof raw.address === 'object') {
          const addr = raw.address;
          address = [
            addr.line1,
            addr.ward,
            addr.district,
            addr.city
          ].filter(Boolean).join(', ') || 'N/A';
        }
        
        // Handle orderItems from API response
        const rawItems = raw.orderItems || raw.items || [];
        console.log('Raw items from API:', rawItems);
        const items: OrderItemUI[] = Array.isArray(rawItems) ? rawItems.map((it: any) => ({
          id: it.id || it.menuItemId || 'item',
          name: it.menuItem?.name || it.name || 'Item',
          quantity: Number(it.quantity || 1),
          price: Number(it.unitPrice ?? it.menuItem?.price ?? it.price ?? 0),
          image: it.menuItem?.imageUrl || it.image,
        })) : [];
        console.log('Processed items from API:', items);
        
        const ui: OrderUI = {
          id: raw.id || orderId,
          status: uiStatus,
          items,
          total: Number(raw.totalAmount ?? raw.total ?? 0),
          deliveryFee: 0,
          address,
          estimatedDelivery: '30-45 minutes',
          paymentMethod: (raw.paymentMethod || '').toString(),
          paymentStatus: (raw.paymentStatus || '').toString(),
        };
        
        console.log('Final UI order from API:', ui);
        setOrder(ui);
        setActiveStep(statusToStep[uiStatus]);
        setIsArrivingSoon(statusToStep[uiStatus] === 3);
        
        // Save to localStorage for future use
        localStorage.setItem('currentOrder', JSON.stringify(raw));
        
      } catch (err) {
        console.error('Error loading order from API:', err);
        setError('Không thể tải thông tin đơn hàng từ server.');
      }
    };

    const loadOrderFromLocalStorage = async () => {
      if (!id) {
        setLoading(false);
        setError('Thiếu mã đơn hàng để theo dõi.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const rawStr = localStorage.getItem('currentOrder');
        console.log('Raw localStorage data:', rawStr);

        if (rawStr) {
          const raw = JSON.parse(rawStr);
          console.log('Parsed order data:', raw);

          // Nếu ID trong localStorage không khớp, thử gọi API nếu có đăng nhập
          if (raw.id && raw.id.toString() !== id) {
            console.log('Order ID mismatch, loading from API if authenticated...');
            if (userId) {
              await loadOrderFromAPI(id);
            } else {
              setError('Không tìm thấy dữ liệu đơn hàng cho mã này. Vui lòng đăng nhập để tải từ server.');
            }
            return;
          }

          const statusRaw = (raw.status || '').toString().toUpperCase();
          const uiStatus: StatusKey = backendToUIStatus[statusRaw] || 'confirmed';

          // Xử lý địa chỉ: có thể là string hoặc object
          let address = 'N/A';
          if (typeof raw.address === 'string') {
            address = raw.address;
          } else if (raw.address && typeof raw.address === 'object') {
            const addr = raw.address;
            address = [addr.line1, addr.ward, addr.district, addr.city].filter(Boolean).join(', ') || 'N/A';
          }

          // Xử lý items từ localStorage
          const rawItems = raw.orderItems || raw.items || [];
          console.log('Raw items:', rawItems);
          const items: OrderItemUI[] = Array.isArray(rawItems)
            ? rawItems.map((it: any) => ({
                id: it.id || it.menuItemId || 'item',
                name: it.menuItem?.name || it.name || it.nameSnapshot || 'Item',
                quantity: Number(it.quantity || 1),
                price: Number(it.unitPrice ?? it.menuItem?.price ?? it.price ?? 0),
                image: it.menuItem?.imageUrl || it.image || it.imageSnapshot,
              }))
            : [];
          console.log('Processed items:', items);

          const ui: OrderUI = {
            id: raw.id || id,
            status: uiStatus,
            items,
            total: Number(raw.totalAmount ?? raw.total ?? 0),
            deliveryFee: 0,
            address,
            estimatedDelivery: '30-45 minutes',
            paymentMethod: (raw.paymentMethod || '').toString(),
            paymentStatus: (raw.paymentStatus || '').toString(),
          };

          console.log('Final UI order:', ui);
          setOrder(ui);
          setActiveStep(statusToStep[uiStatus]);
          setIsArrivingSoon(statusToStep[uiStatus] === 3);

          // Nếu không có item trong localStorage, thử lấy từ API để làm giàu dữ liệu
          if (items.length === 0) {
            console.log('No items found in localStorage order, trying API to enrich...');
            if (userId) {
              try {
                await loadOrderFromAPI(id);
              } catch (apiErr) {
                console.warn('API enrichment failed, keep localStorage data:', apiErr);
              }
            }
          }
        } else {
          // Không có dữ liệu localStorage: nếu đã đăng nhập, gọi API; nếu không, báo lỗi
          console.log('No currentOrder found in localStorage.');
          if (userId) {
            console.log('Authenticated, trying API...');
            await loadOrderFromAPI(id);
          } else {
            setError('Không tìm thấy dữ liệu đơn hàng. Vui lòng đăng nhập để tải từ server.');
          }
        }
      } catch (err) {
        console.error('Error loading order from localStorage:', err);
        // Nếu localStorage lỗi: thử API khi có đăng nhập
        if (userId) {
          console.log('localStorage failed, trying API as fallback...');
          try {
            await loadOrderFromAPI(id);
          } catch (apiErr) {
            console.error('API fallback also failed:', apiErr);
            setError('Không thể tải thông tin đơn hàng.');
          }
        } else {
          setError('Không thể đọc dữ liệu đơn hàng từ trình duyệt. Vui lòng đăng nhập.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrderFromLocalStorage();
  }, [id, userId]);

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h5">Loading order...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Order Tracking
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 3, 
              mb: 3,
              border: isArrivingSoon ? '2px solid #f44336' : 'none',
              boxShadow: isArrivingSoon ? '0 0 10px rgba(244, 67, 54, 0.5)' : 'none'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Order Status
              </Typography>
              {isArrivingSoon && (
                <Chip 
                  label="Arriving Soon!" 
                  color="error" 
                  sx={{ animation: 'pulse 1.5s infinite' }}
                />
              )}
            </Box>
            
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => {
                const stepProps = {};
                const labelProps = {} as any;
                
                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel 
                      {...labelProps}
                      StepIconProps={{
                        icon: index === 0 ? <RestaurantMenu /> :
                              index === 1 ? <Kitchen /> :
                              index === 2 ? <TravelExplore /> :
                              index === 3 ? <DroneIcon /> :
                              <CheckCircle />
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            
            <Box sx={{ mt: 4, mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                Estimated Delivery Time: <strong>{order.estimatedDelivery}</strong>
              </Typography>
              <Typography variant="body1">
                Delivery Address: <strong>{order.address}</strong>
              </Typography>
            </Box>
            
            <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden', mb: 2, boxShadow: 2 }}>
              <TrackingMap height={400} orderId={String(order.id)} />
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Timeline
            </Typography>
            
            <List>
              {activeStep >= 0 && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <RestaurantMenu />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Order Confirmed"
                    secondary="Your order has been received and confirmed"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString()}
                  </Typography>
                </ListItem>
              )}
              
              {activeStep >= 1 && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Kitchen />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Preparing Your Order"
                    secondary="Our chefs are preparing your delicious meal"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(Date.now() - 1000 * 60 * 10).toLocaleTimeString()}
                  </Typography>
                </ListItem>
              )}
              
              {activeStep >= 2 && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <TravelExplore />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Đang tìm drone để giao"
                    secondary="Hệ thống đang chọn drone phù hợp cho đơn hàng của bạn"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString()}
                  </Typography>
                </ListItem>
              )}
              
              {activeStep >= 3 && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: isArrivingSoon ? 'error.main' : 'primary.main' }}>
                      <DroneIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={isArrivingSoon ? "Drone sắp tới!" : "Drone đang giao hàng"}
                    secondary="Đơn hàng đang được drone vận chuyển tới vị trí của bạn"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString()}
                  </Typography>
                </ListItem>
              )}
              
              {activeStep >= 4 && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircle />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Delivered"
                    secondary="Your order has been delivered. Enjoy!"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date().toLocaleTimeString()}
                  </Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>
                Order Details
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Order #{order.id}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <List sx={{ mb: 2, '& .MuiListItem-root:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                {order.items.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                          Không có món ăn nào trong đơn hàng này
                        </Typography>
                      }
                    />
                  </ListItem>
                ) : (
                  order.items.map((item) => (
                    <ListItem key={item.id} sx={{ py: 1.25, px: 0, alignItems: 'center' }}>
                      <ListItemAvatar sx={{ mr: 2 }}>
                        <Avatar src={item.image} alt={item.name} variant="rounded" sx={{ width: 56, height: 56, borderRadius: 2 }} />
                      </ListItemAvatar>
                      <ListItemText
                        sx={{ minWidth: 0, mr: 1 }}
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25 }} noWrap>
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Số lượng: {item.quantity}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Đơn giá: {item.price.toLocaleString('vi-VN')}đ
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ textAlign: 'right', ml: 2, minWidth: 90, flexShrink: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                        </Typography>
                      </Box>
                    </ListItem>
                  ))
                )}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Subtotal</Typography>
                <Typography variant="body1">
                  {(order.items.length > 0
                    ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    : order.total
                  ).toLocaleString('vi-VN')}đ
                </Typography>
              </Box>
              
              {order.deliveryFee > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Phí giao hàng</Typography>
                  <Typography variant="body1">{order.deliveryFee.toLocaleString('vi-VN')}đ</Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  {((order.items.length > 0
                    ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    : order.total
                  ) + order.deliveryFee).toLocaleString('vi-VN')}đ
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`Method: ${order.paymentMethod}`} color="primary" variant="outlined" />
                <Chip
                  label={`Status: ${order.paymentStatus || 'N/A'}`}
                  color={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderTracking;