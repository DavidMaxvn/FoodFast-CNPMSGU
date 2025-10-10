import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Drawer, Toolbar, List, ListItemButton, ListItemText, Typography, Divider } from '@mui/material';
import { useMerchantSession } from '../../store/merchantSession';

const drawerWidth = 240;

// Vietnamese comments:
// RBAC nav: Manager xem toàn bộ. Staff chỉ xem Orders, Inventory (read-only), Feedback.
const managerItems = [
  { label: 'Home', path: '/merchant' },
  { label: 'Dashboard', path: '/merchant/dashboard' },
  { label: 'Orders', path: '/merchant/orders' },
  { label: 'Menu', path: '/merchant/menu' },
  { label: 'Categories', path: '/merchant/categories' },
  { label: 'Inventory', path: '/merchant/inventory' },
  { label: 'Staff', path: '/merchant/staff' },
  { label: 'Reports', path: '/merchant/reports' },
  { label: 'Feedback', path: '/merchant/feedback' },
  { label: 'Login', path: '/merchant/login' },
];
const staffItems = [
  { label: 'Home', path: '/merchant' },
  { label: 'Orders', path: '/merchant/orders' },
  { label: 'Inventory', path: '/merchant/inventory' },
  { label: 'Feedback', path: '/merchant/feedback' },
  { label: 'Login', path: '/merchant/login' },
];

/**
 * Layout cho Merchant/Kitchen Portal với thanh điều hướng trái.
 * Không gọi API. Dùng cho tất cả màn hình merchant.
 */
const MerchantLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentStore } = useMerchantSession();

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar trái */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={800}>Merchant Portal</Typography>
            {/* Vietnamese comments: hiển thị cửa hàng hiện tại và role nội bộ (nếu có) */}
            {currentStore && (
              <Typography variant="caption" color="text.secondary">
                {currentStore.name} — Role: {currentStore.role}
              </Typography>
            )}
          </Box>
          <Divider />
          <List>
            {(currentStore?.role === 'STAFF' ? staffItems : managerItems).map((item) => {
              const selected = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <ListItemButton
                  key={item.path}
                  selected={selected}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Khu vực nội dung */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MerchantLayout;