import React, { useState, useEffect } from 'react';
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
  Avatar,
  Checkbox,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AddressDTO } from '../services/address';

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
  const [useSavedAddress, setUseSavedAddress] = useState<'default' | 'new'>('default');
  const [defaultAddress, setDefaultAddress] = useState<AddressDTO | null>(null);
  const [useOnce, setUseOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    district: '',
    notes: ''
  });

  const auth = useSelector((state: RootState) => state.auth);
  const userId = auth.user ? Number(auth.user.id) : null;
  const { items, totalAmount } = useSelector((state: RootState) => state.cart);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`address:${userId}:default`);
      if (raw) {
        const addr = JSON.parse(raw) as AddressDTO;
        setDefaultAddress(addr);
        setUseSavedAddress('default');
      } else {
        setDefaultAddress(null);
        setUseSavedAddress('new');
      }
    } catch {
      setDefaultAddress(null);
      setUseSavedAddress('new');
    }
  }, [userId]);

  const handleNext = async () => {
    setErrorMsg(null);
    if (activeStep === 0) {
      // Validate and prepare address
      try {
        if (useSavedAddress === 'default') {
          if (!defaultAddress) {
            setErrorMsg('Không có địa chỉ mặc định. Vui lòng nhập địa chỉ mới.');
            return;
          }
        } else {
          // new address flow
          if (!userId) {
            setErrorMsg('Bạn cần đăng nhập để tạo địa chỉ.');
            return;
          }
          if (!address.fullName || !address.phone || !address.street || !address.city) {
            setErrorMsg('Vui lòng điền đầy đủ thông tin địa chỉ.');
            return;
          }
          const newAddress = {
            receiverName: address.fullName,
            phone: address.phone,
            line1: address.street,
            ward: '',
            district: address.district,
            city: address.city,
          };
          // Save as default if not 'use once'
          if (!useOnce) {
            try {
              localStorage.setItem(`address:${userId}:default`, JSON.stringify(newAddress));
              setDefaultAddress(newAddress as unknown as AddressDTO);
            } catch {}
          }
        }
        setActiveStep((prev) => prev + 1);
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.message || 'Không thể tạo/lấy địa chỉ.');
      }
      return;
    }
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
    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (!userId) {
        setErrorMsg('Bạn cần đăng nhập.');
        setSubmitting(false);
        return;
      }
      // Mock address handling: ensure either default or new address is present
      if (useSavedAddress === 'default' && !defaultAddress) {
        setErrorMsg('Thiếu địa chỉ mặc định. Vui lòng nhập địa chỉ mới.');
        setSubmitting(false);
        return;
      }
      if (useSavedAddress === 'new') {
        const requiredFilled = address.fullName && address.phone && address.street && address.city;
        if (!requiredFilled) {
          setErrorMsg('Vui lòng nhập đầy đủ địa chỉ giao hàng.');
          setSubmitting(false);
          return;
        }
        // Save as default if not 'use once'
        if (!useOnce && userId) {
          const toSave = {
            receiverName: address.fullName,
            phone: address.phone,
            line1: address.street,
            ward: '',
            district: address.district,
            city: address.city,
          };
          localStorage.setItem(`address:${userId}:default`, JSON.stringify(toSave));
        }
      }

      const orderItems = items.map((it) => ({
        menuItemId: Number(it.id),
        quantity: it.quantity,
      }));

      // MOCK: Create local order and skip API calls
      const orderId = Date.now();
      const mockOrder = {
        id: orderId,
        status: 'confirmed',
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'vnpay' ? 'paid' : 'cod',
        orderDate: new Date().toISOString(),
        totalAmount: totalAmount + 2,
        items: orderItems,
        address: useSavedAddress === 'default' && defaultAddress ?
          `${defaultAddress.receiverName} - ${defaultAddress.phone}, ${defaultAddress.line1}, ${[defaultAddress.ward, defaultAddress.district, defaultAddress.city].filter(Boolean).join(', ')}` :
          `${address.fullName} - ${address.phone}, ${address.street}, ${[address.district, address.city].filter(Boolean).join(', ')}`,
      };
      localStorage.setItem('currentOrder', JSON.stringify(mockOrder));
      // Redirect to mock payment result
      navigate(`/payment/result?status=success&orderId=${orderId}&method=${paymentMethod}`);
    } catch (error: any) {
      console.error('Error placing order:', error);
      setErrorMsg(error?.response?.data?.message || 'Đặt hàng thất bại');
      navigate('/payment/result?status=failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Delivery Address
            </Typography>
            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>
            )}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <RadioGroup
                row
                value={useSavedAddress}
                onChange={(e) => setUseSavedAddress(e.target.value as 'default' | 'new')}
              >
                <FormControlLabel
                  value="default"
                  control={<Radio />}
                  label="Dùng địa chỉ mặc định"
                  disabled={!defaultAddress}
                />
                <FormControlLabel
                  value="new"
                  control={<Radio />}
                  label="Nhập địa chỉ mới"
                />
              </RadioGroup>
            </FormControl>

            {useSavedAddress === 'default' && defaultAddress && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Địa chỉ mặc định</Typography>
                <Typography gutterBottom>{defaultAddress.receiverName} - {defaultAddress.phone}</Typography>
                <Typography gutterBottom>{defaultAddress.line1}</Typography>
                <Typography gutterBottom>{[defaultAddress.ward, defaultAddress.district, defaultAddress.city].filter(Boolean).join(', ')}</Typography>
              </Paper>
            )}

            {useSavedAddress === 'new' && (
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
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Checkbox checked={useOnce} onChange={(e) => setUseOnce(e.target.checked)} />}
                    label="Chỉ dùng lần này (không đặt làm mặc định)"
                  />
                </Grid>
              </Grid>
            )}
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
                <FormControlLabel value="vnpay" control={<Radio />} label="VNPay" />
                <FormControlLabel value="cod" control={<Radio />} label="Cash on Delivery" />
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
                {useSavedAddress === 'default' && defaultAddress ? (
                  <>
                    <Typography gutterBottom>{defaultAddress.receiverName}</Typography>
                    <Typography gutterBottom>{defaultAddress.phone}</Typography>
                    <Typography gutterBottom>{defaultAddress.line1}</Typography>
                    <Typography gutterBottom>{[defaultAddress.ward, defaultAddress.district, defaultAddress.city].filter(Boolean).join(', ')}</Typography>
                  </>
                ) : (
                  <>
                    <Typography gutterBottom>{address.fullName}</Typography>
                    <Typography gutterBottom>{address.phone}</Typography>
                    <Typography gutterBottom>{address.street}</Typography>
                    <Typography gutterBottom>{address.city}, {address.district}</Typography>
                    {address.notes && (
                      <Typography gutterBottom>Notes: {address.notes}</Typography>
                    )}
                  </>
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
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Place Order'}
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