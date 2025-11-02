import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
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
  SvgIcon,
  StepIcon,
  Alert,
  AlertTitle,
  CircularProgress,
  Button,
  Link,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  RestaurantMenu,
  CheckCircle,
  LocalShipping,
  Kitchen,
  FlightTakeoff,
  TravelExplore,
  Restaurant,
  Schedule
} from '@mui/icons-material';
import { RootState } from '../store';
import TrackingMap from '../components/TrackingMap';
import api from '../services/api';
import { completeDelivery, completeDeliveryByDeliveryId } from '../services/order';
import { useWebSocket } from '../hooks/useWebSocket';

// Order status steps
const steps = ['Đã tạo', 'Đã xác nhận', 'Đang chuẩn bị', 'Sẵn sàng giao hàng', 'Drone đang giao', 'Đã giao hàng'];
const statusToStep = {
  created: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  delivering: 4,
  delivered: 5
} as const;

type StatusKey = keyof typeof statusToStep;

const backendToUIStatus: Record<string, StatusKey> = {
  CREATED: 'created',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_DELIVERY: 'ready',
  ASSIGNED: 'delivering',
  OUT_FOR_DELIVERY: 'delivering',
  DELIVERED: 'delivered',
  COMPLETED: 'delivered',
  REJECTED: 'confirmed',
  CANCELLED: 'confirmed',
  // Fallbacks for early states
  PENDING_PAYMENT: 'created',
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

// Styled components for enhanced UI
const ColoredStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepLabel-root .Mui-completed': {
    color: theme.palette.success.main,
  },
  '& .MuiStepLabel-root .Mui-active': {
    color: theme.palette.primary.main,
    '& .MuiStepIcon-root': {
      animation: 'pulse 2s infinite',
    },
  },
  '& .MuiStepLabel-root .Mui-disabled': {
    color: theme.palette.grey[400],
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)',
    },
    '70%': {
      transform: 'scale(1.05)',
      boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)',
    },
    '100%': {
      transform: 'scale(1)',
      boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)',
    },
  },
}));

const TimelineListItem = styled(ListItem)<{ isActive?: boolean; isCompleted?: boolean }>(({ theme, isActive, isCompleted }) => ({
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
  transition: 'all 0.3s ease-in-out',
  backgroundColor: isActive 
    ? theme.palette.primary.light + '20'
    : isCompleted 
    ? theme.palette.success.light + '15'
    : 'transparent',
  border: isActive 
    ? `2px solid ${theme.palette.primary.main}`
    : isCompleted
    ? `1px solid ${theme.palette.success.main}`
    : '1px solid transparent',
  transform: isActive ? 'scale(1.02)' : 'scale(1)',
  boxShadow: isActive 
    ? `0 4px 12px ${theme.palette.primary.main}25`
    : isCompleted
    ? `0 2px 8px ${theme.palette.success.main}15`
    : 'none',
  '&:hover': {
    backgroundColor: isActive 
      ? theme.palette.primary.light + '30'
      : isCompleted 
      ? theme.palette.success.light + '25'
      : theme.palette.grey[50],
  },
}));

const PulsingAvatar = styled(Avatar)<{ isActive?: boolean }>(({ theme, isActive }) => ({
  animation: isActive ? 'avatarPulse 2s infinite' : 'none',
  '@keyframes avatarPulse': {
    '0%': {
      transform: 'scale(1)',
      boxShadow: `0 0 0 0 ${theme.palette.primary.main}70`,
    },
    '70%': {
      transform: 'scale(1.1)',
      boxShadow: `0 0 0 10px ${theme.palette.primary.main}00`,
    },
    '100%': {
      transform: 'scale(1)',
      boxShadow: `0 0 0 0 ${theme.palette.primary.main}00`,
    },
  },
}));

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
  storeAddress?: string;
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
  const [droneLocation, setDroneLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryId, setDeliveryId] = useState<number | null>(null);
  const [hasArrived, setHasArrived] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive WebSocket endpoint from API base URL and Spring context-path
  const wsUrl = ((api.defaults.baseURL || 'http://localhost:8080/api').replace(/\/+$/, '')
    .replace(/\/api$/, '')) + '/api/ws';
  const { isConnected, subscribe, unsubscribe } = useWebSocket({ url: wsUrl });

  // Helper function to get step color
  const getStepColor = (stepIndex: number) => {
    if (stepIndex < activeStep) return 'success.main';
    if (stepIndex === activeStep) return 'primary.main';
    return 'grey.400';
  };

  // Helper function to get avatar background color
  const getAvatarBgColor = (stepIndex: number) => {
    if (stepIndex < activeStep) return 'success.main';
    if (stepIndex === activeStep) return 'primary.main';
    return 'grey.400';
  };

  // API call to get current order status from server
  const fetchOrderFromAPI = async (orderId: string) => {
    try {
      console.log('Fetching order from API, orderId:', orderId);
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
      // Fallback nếu backend lưu snapshot text
      if (address === 'N/A' && raw.addressSnapshot) {
        address = String(raw.addressSnapshot);
      }
      
      // Địa chỉ cửa hàng (nếu có từ backend)
      let storeAddress: string | undefined = undefined;
      const storeObj = (raw.store || raw.merchant || raw.vendor);
      if (storeObj && typeof storeObj.address === 'string') {
        storeAddress = storeObj.address;
      } else if (typeof raw.storeAddress === 'string') {
        storeAddress = raw.storeAddress;
      } else if (typeof raw.restaurantAddress === 'string') {
        storeAddress = raw.restaurantAddress;
      }
      
      // Handle orderItems from API response
      const rawItems = raw.orderItems || raw.items || [];
      console.log('Raw items from API:', rawItems);
      const items: OrderItemUI[] = Array.isArray(rawItems) ? rawItems.map((it: any) => ({
        id: it.id || it.menuItemId || 'item',
        name: it.menuItem?.name || it.name || it.nameSnapshot || 'Item',
        quantity: Number(it.quantity || 1),
        price: Number(it.unitPrice ?? it.menuItem?.price ?? it.price ?? 0),
        image: it.menuItem?.imageUrl || it.image || it.imageSnapshot,
      })) : [];
      console.log('Processed items from API:', items);
      
      const ui: OrderUI = {
        id: raw.id || orderId,
        status: uiStatus,
        items,
        total: Number(raw.totalAmount ?? raw.total ?? 0),
        deliveryFee: 0,
        address,
        storeAddress,
        estimatedDelivery: 'Đang tính...',
        paymentMethod: (raw.paymentMethod || '').toString(),
        paymentStatus: (raw.paymentStatus || '').toString(),
      };
      
      console.log('Final UI order from API:', ui);
      setOrder(ui);
      setActiveStep(statusToStep[uiStatus]);
      setIsArrivingSoon(statusToStep[uiStatus] === 4);
      // Lưu deliveryId nếu có
      const initialDeliveryId = raw?.delivery?.id;
      if (Number.isFinite(Number(initialDeliveryId))) {
        setDeliveryId(Number(initialDeliveryId));
      }

      // Fetch delivery tracking for ETA và toạ độ bản đồ
      try {
        const trackTargetId = initialDeliveryId || orderId;
        const trackRes = await api.get(`/deliveries/${trackTargetId}/track`);
        const t = trackRes.data || {};
        const deliveryStatusRaw = (t.deliveryStatus || '').toString().toUpperCase();
        // Nếu backend báo delivery đang tiến hành thì force step 'delivering'
        if (['ASSIGNED','IN_PROGRESS','OUT_FOR_DELIVERY'].includes(deliveryStatusRaw)) {
          setActiveStep(statusToStep['delivering']);
        }

        // Update ETA if available
        const eta = Number(t.estimatedMinutesRemaining);
        if (!Number.isNaN(eta) && eta > 0) {
          setOrder(prev => prev ? { ...prev, estimatedDelivery: `${eta} phút` } : prev);
        }

        // Helper: coordinate validity (exclude 0,0 and non-finite)
        const isValidCoord = (lat?: number, lng?: number) => {
          return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
        };

        // Update map coordinates if available
        // Hỗ trợ nhiều định dạng field từ backend (track/tracking)
        const curLat = Number(t.currentLat ?? t?.tracking?.currentLat ?? t.currentLatitude);
        const curLng = Number(t.currentLng ?? t?.tracking?.currentLng ?? t.currentLongitude);
        const destLat = Number(t.destinationLat ?? t?.tracking?.destinationLat ?? t.destLat ?? t.destinationLatitude);
        const destLng = Number(t.destinationLng ?? t?.tracking?.destinationLng ?? t.destLng ?? t.destinationLongitude);

        if (isValidCoord(curLat, curLng)) {
          setDroneLocation({ lat: curLat!, lng: curLng! });
        }

        if (isValidCoord(destLat, destLng)) {
          setCustomerLocation({ lat: destLat!, lng: destLng! });
        }
        // Fallback: nếu track thiếu toạ độ, thử /deliveries/{deliveryId}/detail
        const coordsMissing = !isValidCoord(curLat, curLng) || !isValidCoord(destLat, destLng);
        const deliveryIdFromRaw = raw?.delivery?.id;
        if ((coordsMissing || uiStatus === 'ready') && deliveryIdFromRaw) {
          try {
            const detailRes = await api.get(`/deliveries/${deliveryIdFromRaw}/detail`);
            const d = detailRes.data || {};
            const cp = d.currentPosition as number[] | undefined;
            const waypoints = (d.waypoints || {}) as Record<string, number[]>;
            const etaSec = Number(d.etaSec);

            if (Array.isArray(cp) && cp.length === 2 && isValidCoord(cp[0], cp[1])) {
              setDroneLocation({ lat: cp[0], lng: cp[1] });
            }
            const w0 = Array.isArray((waypoints as any).W0) ? (waypoints as any).W0 : undefined;
            const w2 = Array.isArray(waypoints.W2) ? waypoints.W2 : undefined;
            if (w2 && w2.length === 2 && isValidCoord(w2[0], w2[1])) {
              setCustomerLocation({ lat: w2[0], lng: w2[1] });
            }
            // Nếu trạng thái READY, đặt drone tại vị trí cửa hàng (W0)
            if (uiStatus === 'ready' && w0 && w0.length === 2 && isValidCoord(w0[0], w0[1])) {
              setDroneLocation({ lat: w0[0], lng: w0[1] });
            }
            if (!Number.isNaN(etaSec) && etaSec > 0) {
              const etaMin = Math.round(etaSec / 60);
              setOrder(prev => prev ? { ...prev, estimatedDelivery: `${etaMin} phút` } : prev);
            }
          } catch (detailErr) {
            console.warn('Fallback detail fetch failed:', detailErr);
          }
        }
      } catch (e) {
        // ignore tracking errors for now
      }
      
      // Save to localStorage for future use
      localStorage.setItem('currentOrder', JSON.stringify(raw));
      
      return ui;
    } catch (err) {
      console.error('Error loading order from API:', err);
      throw err;
    }
  };

  // Poll tracking while delivering to keep ETA/map fresh
  useEffect(() => {
    if (!id) return;
    if (activeStep !== 4) return; // only when Drone đang giao

    let timer: any = null;
    const tick = async () => {
      try {
        const trackRes = await api.get(`/deliveries/${id}/track`);
        const t = trackRes.data || {};
        const eta = Number(t.estimatedMinutesRemaining);
        if (!Number.isNaN(eta) && eta >= 0) {
          setOrder(prev => prev ? { ...prev, estimatedDelivery: eta > 0 ? `${eta} phút` : 'Sắp đến nơi' } : prev);
          setIsArrivingSoon(eta > 0 && eta <= 5);
        }
        const curLat = Number(t.currentLat);
        const curLng = Number(t.currentLng);
        const destLat = Number(t.destinationLat);
        const destLng = Number(t.destinationLng);
        if (!Number.isNaN(curLat) && !Number.isNaN(curLng)) {
          setDroneLocation({ lat: curLat, lng: curLng });
        }
        if (!Number.isNaN(destLat) && !Number.isNaN(destLng)) {
          setCustomerLocation({ lat: destLat, lng: destLng });
        }
      } catch {}
    };

    // Immediate fetch then interval
    tick();
    timer = setInterval(tick, 10000);
    return () => timer && clearInterval(timer);
  }, [id, activeStep]);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        setLoading(false);
        setError('Thiếu mã đơn hàng để theo dõi.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Ưu tiên gọi API để lấy trạng thái mới nhất
        console.log('Attempting to load order from API first...');
        await fetchOrderFromAPI(id);
        console.log('Successfully loaded order from API');
      } catch (apiError) {
        console.warn('API call failed, trying localStorage fallback:', apiError);
        
        try {
          // Fallback to localStorage if API fails
          const rawStr = localStorage.getItem('currentOrder');
          console.log('Raw localStorage data:', rawStr);

          if (rawStr) {
            const raw = JSON.parse(rawStr);
            console.log('Parsed order data from localStorage:', raw);

            // Kiểm tra ID có khớp không
            if (raw.id && raw.id.toString() !== id) {
              console.log('Order ID mismatch in localStorage');
              throw new Error('Order ID mismatch');
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
            console.log('Raw items from localStorage:', rawItems);
            const items: OrderItemUI[] = Array.isArray(rawItems)
              ? rawItems.map((it: any) => ({
                  id: it.id || it.menuItemId || 'item',
                  name: it.menuItem?.name || it.name || it.nameSnapshot || 'Item',
                  quantity: Number(it.quantity || 1),
                  price: Number(it.unitPrice ?? it.menuItem?.price ?? it.price ?? 0),
                  image: it.menuItem?.imageUrl || it.image || it.imageSnapshot,
                }))
              : [];
            console.log('Processed items from localStorage:', items);

            const ui: OrderUI = {
              id: raw.id || id,
              status: uiStatus,
              items,
              total: Number(raw.totalAmount ?? raw.total ?? 0),
              deliveryFee: 0,
              address,
              storeAddress: (raw.storeAddress || raw.restaurantAddress),
              estimatedDelivery: '30-45 minutes',
              paymentMethod: (raw.paymentMethod || '').toString(),
              paymentStatus: (raw.paymentStatus || '').toString(),
            };
            const dId = raw?.delivery?.id;
            if (Number.isFinite(Number(dId))) {
              setDeliveryId(Number(dId));
            }

            console.log('Final UI order from localStorage:', ui);
            setOrder(ui);
            setActiveStep(statusToStep[uiStatus]);
            setIsArrivingSoon(statusToStep[uiStatus] === 4);

            console.log('Successfully loaded order from localStorage');
          } else {
            throw new Error('No order data found in localStorage');
          }
        } catch (localStorageError) {
          console.error('Both API and localStorage failed:', localStorageError);
          
          // Nếu có user đăng nhập, hiển thị lỗi API; nếu không, yêu cầu đăng nhập
          if (userId) {
            setError('Không thể tải thông tin đơn hàng từ server. Vui lòng thử lại sau.');
          } else {
            setError('Không tìm thấy dữ liệu đơn hàng. Vui lòng đăng nhập để tải từ server.');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, userId]);

  // Subscribe to real-time order status updates via WebSocket
  useEffect(() => {
    if (!id || !isConnected) return;

    console.log('Subscribing to WebSocket updates for order:', id);
    const sub = subscribe(`/topic/orders/${id}`, (message: any) => {
      try {
        console.log('Received WebSocket message:', message);
        const type = message?.type ?? null;
        const payload = message?.payload ?? message;

        if (type === 'ORDER_STATUS_CHANGED' || typeof payload === 'string') {
          const statusRaw = (typeof payload === 'string' ? payload : String(payload)).toUpperCase();
          const uiStatus: StatusKey = backendToUIStatus[statusRaw] || 'confirmed';
          console.log('Status updated via WebSocket:', statusRaw, '->', uiStatus);
          
          setOrder((prev) => prev ? { ...prev, status: uiStatus } : prev);
          setActiveStep(statusToStep[uiStatus]);
          setIsArrivingSoon(statusToStep[uiStatus] === 4);
          
        } else if (type === 'DELIVERY_ARRIVING') {
          console.log('Delivery arriving notification received');
          setIsArrivingSoon(true);
        }
      } catch (e) {
        console.warn('Failed to process WS message:', e);
      }
    });

    return () => {
      unsubscribe(sub);
    };
  }, [id, isConnected, subscribe, unsubscribe]);

  const ErrorAlert = styled(Alert)`
    margin: 16px 0;
    border-radius: 8px;
  `;
  
  const RetryButton = styled(Button)`
    margin-top: 8px;
  `;

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress size={40} />
          <Typography variant="h6" color="text.secondary">
            Đang tải thông tin đơn hàng...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vui lòng chờ trong giây lát
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    // Luôn hiển thị bản đồ ngay cả khi có lỗi tải dữ liệu
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Theo Dõi Đơn Hàng
        </Typography>
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden', mb: 2, boxShadow: 2 }}>
            <TrackingMap height={400} orderId={id ? String(id) : undefined} />
          </Box>
          <ErrorAlert severity="warning">
            <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
            {error}
            <RetryButton 
              variant="outlined" 
              color="warning" 
              size="small"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </RetryButton>
          </ErrorAlert>
          {!userId && (
            <Box mt={2}>
              <Alert severity="info">
                <AlertTitle>Gợi ý</AlertTitle>
                Bạn có thể <Link href="/login">đăng nhập</Link> để tải dữ liệu đơn hàng từ server.
              </Alert>
            </Box>
          )}
        </Paper>
      </Box>
    );
  }

  if (!order) {
    // Fallback: hiển thị bản đồ và thông báo khi chưa tải được chi tiết đơn
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Theo Dõi Đơn Hàng
        </Typography>
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden', mb: 2, boxShadow: 2 }}>
            <TrackingMap height={400} orderId={id ? String(id) : undefined} />
          </Box>
          <Alert severity="info">
            <AlertTitle>Đang tải dữ liệu đơn hàng</AlertTitle>
            Chưa tải được chi tiết đơn hàng, đang hiển thị bản đồ demo để bạn theo dõi tuyến.
          </Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Theo Dõi Đơn Hàng
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 3, 
              mb: 3,
              border: isArrivingSoon ? '2px solid #f44336' : 'none',
              boxShadow: isArrivingSoon ? '0 0 20px rgba(244, 67, 54, 0.3)' : 3,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Trạng Thái Đơn Hàng
              </Typography>
              
              {isArrivingSoon && (
                <Chip 
                  label=" Sắp tới!" 
                  color="error" 
                  sx={{ 
                    animation: 'pulse 1.5s infinite',
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
            
            <ColoredStepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label, index) => {
                const stepProps = {};
                const labelProps = {} as any;
                
                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel 
                      {...labelProps}
                      StepIconProps={{
                        icon: index === 0 ? <Schedule /> :
                              index === 1 ? <RestaurantMenu /> :
                              index === 2 ? <Kitchen /> :
                              index === 3 ? <TravelExplore /> :
                              index === 4 ? <DroneIcon /> :
                              <CheckCircle />
                      }}
                      sx={{
                        '& .MuiStepLabel-label': {
                          color: getStepColor(index),
                          fontWeight: index === activeStep ? 600 : 400,
                        }
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                );
              })}
            </ColoredStepper>
            
            <Box sx={{ mt: 4, mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                 Thời gian giao hàng dự kiến: <strong style={{ marginLeft: 8 }}>{order.estimatedDelivery}</strong>
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                 Địa chỉ giao hàng: <strong style={{ marginLeft: 8 }}>{order.address}</strong>
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                 Địa chỉ cửa hàng: <strong style={{ marginLeft: 8 }}>{order.storeAddress || '-'}</strong>
              </Typography>
            </Box>
            
            {(order.status === 'ready' || order.status === 'delivering') && (
              <>
                <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden', mb: 2, boxShadow: 2 }}>
                  <TrackingMap
                    height={400}
                    orderId={String(order.id)}
                    droneLocation={droneLocation || undefined}
                    customerLocation={customerLocation || undefined}
                    onArrived={() => {
                      setHasArrived(true);
                      setIsArrivingSoon(false);
                    }}
                  />
                </Box>
                {hasArrived && activeStep === 4 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <AlertTitle>Drone đã tới điểm giao (W2)</AlertTitle>
                        Vui lòng xác nhận đã nhận hàng để hoàn tất đơn.
                      </Box>
                      <Button 
                        variant="contained" 
                        color="success" 
                        disabled={confirming}
                        onClick={async () => {
                          if (!order) return;
                          setConfirming(true);
                          setConfirmError(null);
                          try {
                            if (deliveryId && Number.isFinite(Number(deliveryId))) {
                              await completeDeliveryByDeliveryId(Number(deliveryId));
                            } else {
                              // Fallback nếu không có deliveryId: thử theo orderId (có thể fail nếu backend không hỗ trợ)
                              await completeDelivery(Number(order.id));
                            }
                            setActiveStep(5);
                          } catch (e: any) {
                            setConfirmError(e?.response?.data?.message || 'Xác nhận thất bại, vui lòng thử lại');
                          } finally {
                            setConfirming(false);
                          }
                        }}
                      >
                        Tôi xác nhận đã nhận hàng
                      </Button>
                    </Box>
                    {confirmError && (
                      <Typography variant="caption" color="error">{confirmError}</Typography>
                    )}
                  </Alert>
                )}
              </>
            )}
          </Paper>
          
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
               Lịch Sử Đơn Hàng
            </Typography>
            
            <List sx={{ p: 0 }}>
              <TimelineListItem 
                isCompleted={activeStep > 0}
                isActive={activeStep === 0}
              >
                <ListItemAvatar>
                  <PulsingAvatar 
                    sx={{ bgcolor: getAvatarBgColor(0) }}
                    isActive={activeStep === 0}
                  >
                    <Schedule />
                  </PulsingAvatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                       Đơn hàng đã tạo
                    </Typography>
                  }
                  secondary="Đơn hàng của bạn đã được tạo và đang chờ xác nhận"
                />
                <Typography variant="body2" color="text.secondary">
                  {new Date(Date.now() - 1000 * 60 * 20).toLocaleTimeString()}
                </Typography>
              </TimelineListItem>
              
              {activeStep >= 1 && (
                <TimelineListItem 
                  isCompleted={activeStep > 1}
                  isActive={activeStep === 1}
                >
                  <ListItemAvatar>
                    <PulsingAvatar 
                      sx={{ bgcolor: getAvatarBgColor(1) }}
                      isActive={activeStep === 1}
                    >
                      <RestaurantMenu />
                    </PulsingAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                         Đơn hàng đã xác nhận
                      </Typography>
                    }
                    secondary="Đơn hàng của bạn đã được tiếp nhận và xác nhận"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString()}
                  </Typography>
                </TimelineListItem>
              )}
              
              {activeStep >= 2 && (
                <TimelineListItem 
                  isCompleted={activeStep > 2}
                  isActive={activeStep === 2}
                >
                  <ListItemAvatar>
                    <PulsingAvatar 
                      sx={{ bgcolor: getAvatarBgColor(2) }}
                      isActive={activeStep === 2}
                    >
                      <Kitchen />
                    </PulsingAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                         Đang chuẩn bị món ăn
                      </Typography>
                    }
                    secondary="Đầu bếp đang chuẩn bị những món ăn ngon cho bạn"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(Date.now() - 1000 * 60 * 10).toLocaleTimeString()}
                  </Typography>
                </TimelineListItem>
              )}
              
              {activeStep >= 3 && (
                <TimelineListItem 
                  isCompleted={activeStep > 3}
                  isActive={activeStep === 3}
                >
                  <ListItemAvatar>
                    <PulsingAvatar 
                      sx={{ bgcolor: getAvatarBgColor(3) }}
                      isActive={activeStep === 3}
                    >
                      <TravelExplore />
                    </PulsingAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                         Đang tìm drone để giao
                      </Typography>
                    }
                    secondary="Hệ thống đang chọn drone phù hợp cho đơn hàng của bạn"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString()}
                  </Typography>
                </TimelineListItem>
              )}
              
              {activeStep >= 4 && (
                <TimelineListItem 
                  isCompleted={activeStep > 4}
                  isActive={activeStep === 4}
                >
                  <ListItemAvatar>
                    <PulsingAvatar 
                      sx={{ 
                        bgcolor: isArrivingSoon ? 'error.main' : getAvatarBgColor(4),
                        animation: isArrivingSoon ? 'avatarPulse 1s infinite' : activeStep === 4 ? 'avatarPulse 2s infinite' : 'none'
                      }}
                      isActive={activeStep === 4 || isArrivingSoon}
                    >
                      <DroneIcon />
                    </PulsingAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {isArrivingSoon ? " Drone sắp tới!" : " Drone đang giao hàng"}
                      </Typography>
                    }
                    secondary="Đơn hàng đang được drone vận chuyển tới vị trí của bạn"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString()}
                  </Typography>
                </TimelineListItem>
              )}
              
              {activeStep >= 5 && (
                <TimelineListItem 
                  isCompleted={true}
                  isActive={false}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircle />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                         Đã giao hàng thành công
                      </Typography>
                    }
                    secondary="Đơn hàng đã được giao thành công. Chúc bạn ngon miệng!"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date().toLocaleTimeString()}
                  </Typography>
                </TimelineListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                 Chi Tiết Đơn Hàng
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Mã đơn hàng: #{order.id}
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
                    <ListItem key={item.id} sx={{ py: 1.5, px: 0, alignItems: 'center' }}>
                      <ListItemAvatar sx={{ mr: 2 }}>
                        <Avatar 
                          src={item.image} 
                          alt={item.name} 
                          variant="rounded" 
                          sx={{ width: 56, height: 56, borderRadius: 2, boxShadow: 1 }} 
                        />
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </Typography>
                    </ListItem>
                  ))
                )}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Tạm tính:</Typography>
                <Typography variant="body2">{order.total.toLocaleString('vi-VN')}đ</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Phí giao hàng:</Typography>
                <Typography variant="body2">{order.deliveryFee.toLocaleString('vi-VN')}đ</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Tổng cộng:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {(order.items.length > 0
                    ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    : order.total
                  ).toLocaleString('vi-VN')}đ
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                 Phương thức thanh toán: {order.paymentMethod || 'Chưa xác định'}
              </Typography>
              {order.paymentStatus && (
                <Typography variant="body2" color="text.secondary">
                  Trạng thái thanh toán: {order.paymentStatus}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderTracking;