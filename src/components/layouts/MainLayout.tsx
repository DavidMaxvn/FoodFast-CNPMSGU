import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Badge, Container, Box } from '@mui/material';
import { ShoppingCart, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { items } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => navigate('/')}
          >
            FastFood Delivery
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/cart')}
              sx={{ mr: 2 }}
            >
              <Badge badgeContent={cartItemCount} color="error">
                <ShoppingCart />
                
              </Badge>
            </Button>
            
            {isAuthenticated ? (
              <Button 
                color="inherit"
                onClick={() => navigate('/profile')}
              >
                <Person />
                Profile
              </Button>
            ) : (
              <Button 
                color="inherit"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
      
      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} FastFood Delivery. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default MainLayout;