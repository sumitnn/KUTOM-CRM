// src/routes/admin/AdminRoutes.jsx
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import AdminMainLayout from "../../layout/admin/AdminMainLayout";

import AdminDashboard from "../../pages/admin/AdminDashboard";
import WalletManagementPage from "../../pages/admin/WalletManagementPage";
import AdminProducts from "../../pages/admin/AdminProducts";
import OrderManagementPage from "../../pages/admin/OrderManagementPage";
import AdminVendor from "../../pages/admin/AdminVendor";
import AdminStockist from "../../pages/admin/AdminStockist";
import Profile from "../../pages/common/Profile";
import ChangePassword from "../../components/auths/ChangePassword";


const adminRoutes = [
  <Route key="admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
    <Route path="/admin/dashboard" element={<AdminMainLayout><AdminDashboard /></AdminMainLayout>} />
    <Route path="/admin/wallet" element={<AdminMainLayout><WalletManagementPage /></AdminMainLayout>} />
    <Route path="/admin/products" element={<AdminMainLayout><AdminProducts /></AdminMainLayout>} />
    <Route path="/admin/orders" element={<AdminMainLayout><OrderManagementPage /></AdminMainLayout>} />
    <Route path="/admin/vendor" element={<AdminMainLayout><AdminVendor /></AdminMainLayout>} />
    <Route path="/admin/stockist" element={<AdminMainLayout><AdminStockist /></AdminMainLayout>} />
    <Route path="/settings/profile" element={<AdminMainLayout><Profile /></AdminMainLayout>} />
    <Route path="/settings/change-password" element={<AdminMainLayout><ChangePassword /></AdminMainLayout>} />
   
  </Route>
];

export default adminRoutes;
