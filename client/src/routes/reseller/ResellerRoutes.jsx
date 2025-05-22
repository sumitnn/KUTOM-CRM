import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import ResellerMainLayout from "../../layout/reseller/ResellerMainLayout";
import StockistDashboard from "../../pages/stockist/StockistDashboard";

const ResellerRoutes= [
  <Route element={<ProtectedRoute allowedRoles={["reseller"]} />}>
    <Route path="/reseller/dashboard" element={<ResellerMainLayout><StockistDashboard /></ResellerMainLayout>} />
  </Route>
];

export default ResellerRoutes;
