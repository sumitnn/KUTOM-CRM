// src/components/RedirectIfAuthenticatedRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const RedirectIfAuthenticatedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return children;

  switch (user.role) {
    case "admin":
      return <Navigate to="/dashboard" />;
    case "vendor":
      return <Navigate to="/dashboard" />;
    case "stockist":
      return <Navigate to="/dashboard" />;
    case "reseller":
      return <Navigate to="/dashboard" />;
    default:
      return <Navigate to="/" />;
  }
};

export default RedirectIfAuthenticatedRoute;
