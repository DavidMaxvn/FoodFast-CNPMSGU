import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const steps = ['Delivery Address', 'Payment Method', 'Review Order'];

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    district: '',
    notes: ''
  });

  const { items, totalAmount } = useSelector((state: RootState) => state.cart);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(event.target.value);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    try {
      // Validate required fields
      if (!address.fullName || !address.phone || !address.street || !address.city || !address.district) {
        alert('Vui lòng điền đầy đủ thông tin giao hàng');
        return;
      }

      // Create order data
      const orderData = {
        items: items,
        totalAmount: totalAmount + 2, // Include delivery fee
        deliveryAddress: address,
        paymentMethod: paymentMethod,
        orderDate: new Date().toISOString()
      };

      if (paymentMethod === 'vnpay') {
        // Redirect to VNPay payment gateway
        const vnpayUrl = await createVNPayPayment(orderData);
        window.location.href = vnpayUrl;
      } else {
        // For COD, create order directly
        const orderId = await createOrder(orderData);
        navigate(`/payment-result?status=success&orderId=${orderId}&method=cod`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      navigate('/payment-result?status=failed');
    }
  };

  const createVNPayPayment = async (orderData: any): Promise<string> => {
    // In a real app, this would call your backend API
    // For now, we'll simulate VNPay URL generation
    
    // Store order data for later retrieval
    const orderId = `ORD_${Date.now()}`;
    localStorage.setItem('pendingOrder', JSON.stringify({
      ...orderData,
      id: orderId,
      status: 'pending'
    }));

    // Format date correctly for VNPay (YYYYMMDDHHMMSS)
    const now = new Date();
    const createDate = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const vnpayParams = new URLSearchParams({
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: 'DEMO123', // Demo TMN code
      vnp_Amount: Math.round(orderData.totalAmount * 23000 * 100).toString(), // Convert USD to VND cents (1 USD ≈ 23,000 VND)
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: encodeURIComponent(`Thanh toan don hang FastFood - ${orderId}`),
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: encodeURIComponent(`${window.location.origin}/payment-result`),
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate
    });

    // In production, you would call your backend to create the secure VNPay URL
    // return await fetch('/api/create-vnpay-payment', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(orderData)
    // }).then(res => res.json()).then(data => data.paymentUrl);

    // For demo purposes, simulate VNPay redirect and return to success page
    // Since we can't actually integrate with VNPay sandbox without proper credentials,
    // we'll simulate the payment process
    setTimeout(() => {
      window.location.href = `/payment-result?vnp_ResponseCode=00&vnp_TxnRef=${orderId}&vnp_Amount=${vnpayParams.get('vnp_Amount')}&vnp_OrderInfo=${vnpayParams.get('vnp_OrderInfo')}`;
    }, 1000);

    return `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${vnpayParams.toString()}`;
  };

  const createOrder = async (orderData: any): Promise<string> => {
    // In a real app, this would call your backend API
    // For now, we'll simulate order creation
    const orderId = `ORD_${Date.now()}`;
    
    // Store order in localStorage for demo purposes
    localStorage.setItem('currentOrder', JSON.stringify({
      ...orderData,
      id: orderId,
      status: 'confirmed'
    }));

    return orderId;
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Delivery Address
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="fullName"
                  name="fullName"
                  label="Full Name"
                  fullWidth
                  variant="outlined"
                  value={address.fullName}
                  onChange={handleAddressChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="phone"
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  variant="outlined"
                  value={address.phone}
                  onChange={handleAddressChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  id="street"
                  name="street"
                  label="Street Address"
                  fullWidth
                  variant="outlined"
                  value={address.street}
                  onChange={handleAddressChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="city"
                  name="city"
                  label="City"
                  fullWidth
                  variant="outlined"
                  value={address.city}
                  onChange={handleAddressChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="district"
                  name="district"
                  label="District"
                  fullWidth
                  variant="outlined"
                  value={address.district}
                  onChange={handleAddressChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="notes"
                  name="notes"
                  label="Delivery Notes"
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  placeholder="Any special instructions for delivery"
                  value={address.notes}
                  onChange={handleAddressChange}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                aria-label="payment-method"
                name="payment-method"
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <Paper sx={{ mb: 2, p: 2, border: paymentMethod === 'vnpay' ? '2px solid #1976d2' : 'none' }}>
                  <FormControlLabel
                    value="vnpay"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img 
                          src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" 
                          alt="VNPay" 
                          width="60" 
                          style={{ marginRight: '10px' }}
                        />
                        <Typography>VNPay</Typography>
                      </Box>
                    }
                  />
                </Paper>
                <Paper sx={{ mb: 2, p: 2, border: paymentMethod === 'cod' ? '2px solid #1976d2' : 'none' }}>
                  <FormControlLabel
                    value="cod"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 60, 
                            height: 40, 
                            bgcolor: 'grey.300', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 1
                          }}
                        >
                          <Typography variant="body2">CASH</Typography>
                        </Box>
                        <Typography>Cash on Delivery</Typography>
                      </Box>
                    }
                  />
                </Paper>
              </RadioGroup>
            </FormControl>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <List sx={{ mb: 2 }}>
              {items.map((item: CartItem) => (
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
              <Divider />
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Subtotal" />
                <Typography variant="body2">${totalAmount.toFixed(2)}</Typography>
              </ListItem>
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Delivery Fee" />
                <Typography variant="body2">$2.00</Typography>
              </ListItem>
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemText primary="Total" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ${(totalAmount + 2).toFixed(2)}
                </Typography>
              </ListItem>
            </List>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Delivery Address
                </Typography>
                <Typography gutterBottom>{address.fullName}</Typography>
                <Typography gutterBottom>{address.phone}</Typography>
                <Typography gutterBottom>{address.street}</Typography>
                <Typography gutterBottom>{address.city}, {address.district}</Typography>
                {address.notes && (
                  <Typography gutterBottom>Notes: {address.notes}</Typography>
                )}
              </Grid>
              <Grid item container direction="column" xs={12} sm={6}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Payment Method
                </Typography>
                <Typography gutterBottom>
                  {paymentMethod === 'vnpay' ? 'VNPay' : 'Cash on Delivery'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Checkout
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        {getStepContent(activeStep)}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {activeStep !== 0 && (
          <Button onClick={handleBack} sx={{ mr: 1 }}>
            Back
          </Button>
        )}
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handlePlaceOrder}
          >
            Place Order
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
          >
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Checkout;