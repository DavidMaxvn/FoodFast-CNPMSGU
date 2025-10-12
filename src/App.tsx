import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ItemDetail from './pages/ItemDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import Stores from './pages/Stores';
import StoreMenu from './pages/StoreMenu';
import OrderHistory from './pages/OrderHistory';
import Notifications from './pages/Notifications';
import OrderConfirmation from './pages/OrderConfirmation';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
// import MenuManagement from './pages/admin/MenuManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import OrderManagement from './pages/admin/OrderManagement';
import StaffManagement from './pages/admin/StaffManagement';
import KitchenBoard from './pages/admin/KitchenBoard';
import DroneConsole from './pages/admin/DroneConsole';
// Merchant/Kitchen Portal Pages
import MerchantHome from './pages/merchant/MerchantHome';
import MerchantLogin from './pages/merchant/MerchantLogin';
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import MerchantOrders from './pages/merchant/MerchantOrders';
import MerchantOrderDetail from './pages/merchant/MerchantOrderDetail';
import MerchantMenu from './pages/merchant/MerchantMenu';
import MerchantMenuForm from './pages/merchant/MerchantMenuForm';
import MerchantCategories from './pages/merchant/MerchantCategories';
import MerchantInventory from './pages/merchant/MerchantInventory';
import MerchantStaff from './pages/merchant/MerchantStaff';
import MerchantReports from './pages/merchant/MerchantReports';
import MerchantLayout from './components/layouts/MerchantLayout';
import MerchantFeedback from './pages/merchant/MerchantFeedback';
import { MerchantSessionProvider } from './store/merchantSession';
import RequireManager from './components/route/RequireManager';

const theme = createTheme({
  palette: {
    primary: { main: '#FF3D00' }, // Fastfood red-orange
    secondary: { main: '#FFC107' }, // Amber accent
    background: { default: '#FFFFFF' }, // Light amber background
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
});

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Add AdminRoute to protect admin pages by authentication and role
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const auth = useSelector((state: RootState) => state.auth);
  const hasAdminRole = Array.isArray(auth.user?.roles) && (
    auth.user!.roles.includes('ADMIN') || auth.user!.roles.includes('ROLE_ADMIN')
  );

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return hasAdminRole ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Stores />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="menu/:id" element={<ItemDetail />} />
          <Route path="cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="payment/result" element={<PaymentResult />} />
          <Route path="order/tracking/:id" element={<OrderTracking />} />
          <Route path="stores" element={<Stores />} />
          <Route path="stores/:id/menu" element={<StoreMenu />} />
          <Route path="orders/history" element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
          <Route path="order/confirmation/:id" element={<PrivateRoute><OrderConfirmation /></PrivateRoute>} />
          <Route path="notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Dashboard />} />
          {/* <Route path="menu" element={<MenuManagement />} /> */}
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="kitchen" element={<KitchenBoard />} />
          <Route path="drones" element={<DroneConsole />} />
        </Route>

        {/* Merchant/Kitchen Portal (Mock) với nav trái */}
        <Route path="/merchant" element={<MerchantSessionProvider><MerchantLayout /></MerchantSessionProvider>}>
          <Route index element={<MerchantHome />} />
          <Route path="login" element={<MerchantLogin />} />
          {/* Manager-only routes */}
          <Route element={<RequireManager />}>
            <Route path="dashboard" element={<MerchantDashboard />} />
            <Route path="menu" element={<MerchantMenu />} />
            <Route path="menu/new" element={<MerchantMenuForm />} />
            <Route path="categories" element={<MerchantCategories />} />
            <Route path="staff" element={<MerchantStaff />} />
            <Route path="reports" element={<MerchantReports />} />
          </Route>
          <Route path="orders" element={<MerchantOrders />} />
          <Route path="orders/:id" element={<MerchantOrderDetail />} />
          <Route path="inventory" element={<MerchantInventory />} />
          <Route path="feedback" element={<MerchantFeedback />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;