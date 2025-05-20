import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RedirectIfAuthenticatedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) return children;

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin/dashboard" />;
    case "vendor":
      return <Navigate to="/vendor/dashboard" />;
    case "stockist":
      return <Navigate to="/stockist/dashboard" />;
    default:
      return <Navigate to="/" />;
  }
};

export default RedirectIfAuthenticatedRoute;
