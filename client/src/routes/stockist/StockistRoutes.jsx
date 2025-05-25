import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import StockistMainLayout from "../../layout/stockist/StockistMainLayout";
import StockistDashboard from "../../pages/stockist/StockistDashboard";
import Logout from "../../pages/Logout";

const StockistRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["stockist"]} />} key="stockist">
    <Route
      path="/stockist/dashboard"
      element={<StockistMainLayout><StockistDashboard /></StockistMainLayout>}
    />
    <Route key="logout" path="/stockist/logout" element={<Logout/>} />
  </Route>
];

export default StockistRoutes;
