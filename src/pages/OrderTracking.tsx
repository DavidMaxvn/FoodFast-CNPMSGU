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
  Chip
} from '@mui/material';
import {
  RestaurantMenu,
  TwoWheeler,
  CheckCircle,
  LocalShipping,
  Kitchen
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getOrderById } from '../services/order';
import TrackingMap from '../components/TrackingMap';
// Order status steps
const steps = ['Confirmed', 'Preparing', 'Ready for Delivery', 'On the Way', 'Delivered'];
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
  OUT_FOR_DELIVERY: 'delivering',
  DELIVERED: 'delivered',
  // Fallbacks for early states
  CREATED: 'confirmed',
  PENDING_PAYMENT: 'confirmed',
  PAID: 'confirmed',
};

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
    const fetchOrder = async () => {
      if (!id || !userId) {
        setLoading(false);
        setError('Please login to view your order.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const raw = await getOrderById(userId, Number(id));
        // Map backend Order entity to UI model
        const uiStatus: StatusKey = backendToUIStatus[raw.status] || 'confirmed';
        const address = raw.address ? [
          raw.address.line1,
          [raw.address.ward, raw.address.district, raw.address.city].filter(Boolean).join(', ')
        ].filter(Boolean).join(', ') : 'N/A';
        const items: OrderItemUI[] = Array.isArray(raw.orderItems) ? raw.orderItems.map((it: any) => ({
          id: it.id,
          name: it.menuItem?.name || 'Item',
          quantity: it.quantity,
          price: Number(it.unitPrice ?? it.menuItem?.price ?? 0),
          image: it.menuItem?.imageUrl,
        })) : [];
        const ui: OrderUI = {
          id: raw.id,
          status: uiStatus,
          items,
          total: Number(raw.totalAmount ?? 0),
          deliveryFee: 2.00,
          address,
          estimatedDelivery: '30-45 minutes',
          paymentMethod: (raw.paymentMethod || '').toString(),
          paymentStatus: (raw.paymentStatus || '').toString(),
        };
        setOrder(ui);
        setActiveStep(statusToStep[uiStatus]);
        setIsArrivingSoon(statusToStep[uiStatus] === 3);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
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
                              index === 2 ? <LocalShipping /> :
                              index === 3 ? <TwoWheeler /> :
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
            
            <TrackingMap 
              orderId={order.id?.toString()}
              height={200}
            />
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
                      <LocalShipping />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Ready for Delivery"
                    secondary="Your order is packed and ready for delivery"
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
                      <TwoWheeler />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={isArrivingSoon ? "Almost There!" : "On the Way"}
                    secondary="Your order is on its way to your location"
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
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Details
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Order #{order.id}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <List sx={{ mb: 2 }}>
                {order.items.map((item) => (
                  <ListItem key={item.id} sx={{ py: 1, px: 0 }}>
                    <ListItemAvatar>
                      <Avatar src={item.image} alt={item.name} variant="rounded" />
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.name}
                      secondary={`Quantity: ${item.quantity}`}
                    />
                    <Typography variant="body2">
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Subtotal</Typography>
                <Typography variant="body1">${order.total.toFixed(2)}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Delivery Fee</Typography>
                <Typography variant="body1">${order.deliveryFee.toFixed(2)}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">
                  ${(order.total + order.deliveryFee).toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment Method: {order.paymentMethod}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment Status: {order.paymentStatus || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderTracking;