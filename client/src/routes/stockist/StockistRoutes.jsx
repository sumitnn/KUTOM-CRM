import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import MainLayout from "../../layout/admin/AdminMainLayout";
import StockistDashboard from "../../pages/stockist/StockistDashboard";

const StockistRoutes= [
  <Route element={<ProtectedRoute allowedRoles={["stockist"]} />}>
    <Route path="/stockist/dashboard" element={<MainLayout><StockistDashboard /></MainLayout>} />
  </Route>
];

export default StockistRoutes;
