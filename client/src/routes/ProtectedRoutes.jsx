// src/ProtectedRoutes.jsx
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, checkProfileCompletion = false }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;
  
  // Check allowed roles first
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  

  // Only check profile completion if explicitly required AND user is vendor/reseller
  if (
    checkProfileCompletion &&
    ['vendor', 'reseller', 'stockist'].includes(user.role) &&
    (user.profile_completed === undefined || 
     user.profile_completed === null || 
     parseFloat(user.profile_completed) < 16.00)
  ) {
    return <Navigate to={`/${user.role}/settings/profile`} replace />;
  }


  return <Outlet />;
};

export default ProtectedRoute;