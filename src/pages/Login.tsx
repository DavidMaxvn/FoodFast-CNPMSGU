import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Link, 
  CircularProgress,
  Alert
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import jwtDecode from 'jwt-decode';
import api from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        dispatch(loginStart());
        setError(null);
        formik.setSubmitting(true);

        // Sử dụng axios client chung với baseURL/interceptors
        const response = await api.post('/auth/login', {
          email: values.email,
          password: values.password,
        });

        const data = response.data as any;
        const roles = (() => {
          try {
            const decoded: any = jwtDecode(data.token);
            if (decoded?.roles) {
              return String(decoded.roles).split(',').filter((r: string) => r.trim().length > 0);
            }
            return [];
          } catch {
            return [];
          }
        })();

        const user = {
          id: String(data.id),
          email: data.email,
          fullName: data.fullName,
          roles: roles,
        };

        dispatch(loginSuccess({
          user,
          token: data.token,
          refreshToken: data.refreshToken,
        }));

        // nếu là admin -> /admin vào đúng role admin, ngược lại -> /
        const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');
        navigate(isAdmin ? '/admin' : '/');
      } catch (err: any) {
        dispatch(loginFailure());
        // Phân biệt lỗi mạng (backend không chạy/CORS) và 401 sai thông tin
        if (!err?.response) {
          setError('Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend (http://localhost:8081) và cơ sở dữ liệu.');
        } else {
          const status = err.response.status;
          const backendMsg = err.response?.data?.message;
          if (status === 401) {
            setError(backendMsg || 'Email hoặc mật khẩu không đúng');
          } else {
            setError(backendMsg || 'Đăng nhập thất bại. Vui lòng thử lại sau');
          }
        }
      } finally {
        formik.setSubmitting(false);
      }
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Login to Your Account
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            variant="outlined"
            margin="normal"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
          
          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={formik.isSubmitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {formik.isSubmitting ? <CircularProgress size={24} /> : 'Login'}
          </Button>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register">
                Register here
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;