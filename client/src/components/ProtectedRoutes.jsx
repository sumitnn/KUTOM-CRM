
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
