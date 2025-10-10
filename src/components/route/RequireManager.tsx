import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMerchantSession } from '../../store/merchantSession';

// Vietnamese comments:
// Guard route: chỉ cho phép MANAGER truy cập các màn hình quản trị.
// STAFF sẽ bị chuyển hướng về Orders.

const RequireManager: React.FC = () => {
  const { currentStore } = useMerchantSession();
  const location = useLocation();
  if (currentStore?.role === 'STAFF') {
    return <Navigate to="/merchant/orders" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

export default RequireManager;