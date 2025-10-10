import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Box, Card, CardContent, Typography, Chip, Stack, Button } from '@mui/material';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  // const roles = user?.roles || [];

  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Thông tin tài khoản
          </Typography>

          <Stack spacing={1}>
            <Typography variant="body1"><strong>Họ tên:</strong> {user?.fullName || '—'}</Typography>
            <Typography variant="body1"><strong>Email:</strong> {user?.email || '—'}</Typography>
         
          </Stack>

          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="contained" color="primary" onClick={() => navigate('/')}>Về trang chủ</Button>
            <Button variant="outlined" color="error" onClick={onLogout}>Đăng xuất</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;