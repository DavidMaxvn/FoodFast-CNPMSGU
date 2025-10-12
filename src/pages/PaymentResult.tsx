import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';
import { simulateVNPayReturn } from '../services/payment';

const PaymentResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [orderId, setOrderId] = useState<string>('');
  
  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get('status') || 'processing';
  const orderIdParam = searchParams.get('orderId');
  const paymentMethod = searchParams.get('method');
  
  // VNPay return parameters
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const vnpTxnRef = searchParams.get('vnp_TxnRef');

  useEffect(() => {
    // Handle VNPay return
    if (vnpResponseCode) {
      // Notify backend to process VNPay return (verify signature & update order/payment)
      try {
        const query: Record<string, string> = {};
        searchParams.forEach((value, key) => { query[key] = value; });
        simulateVNPayReturn(query);
      } catch (e) {
        console.error('Failed to verify VNPay return on backend', e);
      }

      if (vnpResponseCode === '00') {
        // Payment successful
        const newOrderId = vnpTxnRef || `ORD_${Date.now()}`;
        setOrderId(newOrderId);
        
        // Get pending order data and update it
        const pendingOrderData = localStorage.getItem('pendingOrder');
        let orderData;
        
        if (pendingOrderData) {
          orderData = JSON.parse(pendingOrderData);
          orderData.status = 'confirmed';
          orderData.paymentStatus = 'paid';
          orderData.id = newOrderId;
        } else {
          orderData = {
            id: newOrderId,
            status: 'confirmed',
            paymentMethod: 'vnpay',
            paymentStatus: 'paid',
            orderDate: new Date().toISOString(),
            totalAmount: parseFloat(searchParams.get('vnp_Amount') || '0') / 2300000 // Convert VND cents back to USD
          };
        }
        
        localStorage.setItem('currentOrder', JSON.stringify(orderData));
        localStorage.removeItem('pendingOrder'); // Clean up pending order
        
        // Clear cart after successful payment
        dispatch(clearCart());
      } else {
        // Payment failed - keep pending order for retry
        const newOrderId = vnpTxnRef || `ORD_${Date.now()}`;
        setOrderId(newOrderId);
      }
    } else if (orderIdParam) {
      setOrderId(orderIdParam);
      if (status === 'success') {
        dispatch(clearCart());
      }
    }
  }, [vnpResponseCode, vnpTxnRef, orderIdParam, status, dispatch, searchParams]);

  const getPaymentStatus = () => {
    if (vnpResponseCode) {
      return vnpResponseCode === '00' ? 'success' : 'failed';
    }
    return status;
  };

  const renderContent = () => {
    const paymentStatus = getPaymentStatus();
    
    switch (paymentStatus) {
      case 'success':
        return (
          <>
            <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Thanh toán thành công!
            </Typography>
            <Typography variant="body1" paragraph>
              Đơn hàng của bạn đã được đặt thành công. 
              {orderId && ` Mã đơn hàng: ${orderId}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {paymentMethod === 'vnpay' ? 'Thanh toán qua VNPay' : 'Thanh toán khi nhận hàng'}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/order/tracking/${orderId}`)}
                sx={{ mr: 2 }}
                disabled={!orderId}
              >
                Theo dõi đơn hàng
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Tiếp tục mua sắm
              </Button>
            </Box>
          </>
        );
      case 'failed':
        return (
          <>
            <Cancel color="error" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Thanh toán thất bại
            </Typography>
            <Typography variant="body1" paragraph>
              Không thể xử lý thanh toán của bạn. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
            </Typography>
            {vnpResponseCode && (
              <Typography variant="body2" color="text.secondary" paragraph>
                Mã lỗi VNPay: {vnpResponseCode}
              </Typography>
            )}
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/checkout')}
                sx={{ mr: 2 }}
              >
                Thử lại
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/cart')}
              >
                Quay lại giỏ hàng
              </Button>
            </Box>
          </>
        );
      default:
        return (
          <>
            <CircularProgress size={80} sx={{ mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Đang xử lý thanh toán
            </Typography>
            <Typography variant="body1" paragraph>
              Vui lòng đợi trong khi chúng tôi xử lý thanh toán của bạn. Không đóng trang này.
            </Typography>
          </>
        );
    }
  };

  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {renderContent()}
      </Paper>
    </Box>
  );
};

export default PaymentResult;