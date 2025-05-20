
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();
  if (user == null) {
    return <Navigate to="/" replace />;
  }

  return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
