import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import MainLayout from "../../layout/admin/AdminMainLayout";
import VendorDashboard from "../../pages/vendor/VendorDashboard";

const VendorRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
    <Route path="/vendor/dashboard" element={<MainLayout><VendorDashboard /></MainLayout>} />
  </Route>
];

export default VendorRoutes;
