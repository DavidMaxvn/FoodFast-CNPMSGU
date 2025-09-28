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

// Mock order data
const mockOrder = {
  id: 'ORD-12345',
  status: 'preparing',
  items: [
    { id: '1', name: 'Cheeseburger', quantity: 2, price: 8.99, image: 'https://via.placeholder.com/50' },
    { id: '2', name: 'French Fries', quantity: 1, price: 3.99, image: 'https://via.placeholder.com/50' },
    { id: '3', name: 'Coca Cola', quantity: 2, price: 1.99, image: 'https://via.placeholder.com/50' }
  ],
  total: 25.95,
  deliveryFee: 2.00,
  address: '123 Main St, Anytown, USA',
  estimatedDelivery: '30-45 minutes',
  paymentMethod: 'VNPay'
};

// Order status steps
const steps = ['Confirmed', 'Preparing', 'Ready for Delivery', 'On the Way', 'Delivered'];
const statusToStep = {
  confirmed: 0,
  preparing: 1,
  ready: 2,
  delivering: 3,
  delivered: 4
};

const OrderTracking: React.FC = () => {
  const [order, setOrder] = useState(mockOrder);
  const [activeStep, setActiveStep] = useState(statusToStep[order.status as keyof typeof statusToStep]);
  const [isArrivingSoon, setIsArrivingSoon] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeStep < 3) {
        setActiveStep(prevStep => prevStep + 1);
        setOrder(prev => ({
          ...prev,
          status: Object.keys(statusToStep)[activeStep + 1]
        }));
      } else if (activeStep === 3) {
        setIsArrivingSoon(true);
      }
    }, 10000); // Update every 10 seconds for demo

    return () => clearTimeout(timer);
  }, [activeStep]);

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
                const labelProps = {};
                
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
            
            <Box 
              sx={{ 
                height: 200, 
                bgcolor: 'grey.200', 
                borderRadius: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Map View (Will integrate with real map service)
              </Typography>
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
                Payment Status: Paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderTracking;