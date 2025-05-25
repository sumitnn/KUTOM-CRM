// src/components/RedirectIfAuthenticatedRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const RedirectIfAuthenticatedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return children;

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin/dashboard" />;
    case "vendor":
      return <Navigate to="/vendor/dashboard" />;
    case "stockist":
      return <Navigate to="/stockist/dashboard" />;
    case "reseller":
      return <Navigate to="/reseller/dashboard" />;
    default:
      return <Navigate to="/" />;
  }
};

export default RedirectIfAuthenticatedRoute;
