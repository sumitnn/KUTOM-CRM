// routes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoutes";
import AdminDashboard from "./pages/AdminDashboard"
import SellerDashboard from "./pages/SellerDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import MainLayout from "./layout/MainLayout";
import PageNotFound from "./PageNotFound";
import Login from "./components/auths/Login"
import AdminProducts from "./pages/admin/AdminProducts";
import AdminVendor from "./pages/admin/AdminVendor";
import AdminSeller from "./pages/admin/AdminSeller";
import Profile from "./pages/Profile";
import ChangePassword from "./components/auths/ChangePassword";
import ForgetPasswordForm from "./components/auths/ForgetPasswordForm";
import CommonLayout from "./layout/CommonLayout";
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CommonLayout>
        <Login />
        </CommonLayout>
      } />
      <Route path="/login" element={<CommonLayout>
        <Login />
        </CommonLayout>
      } />
      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route
          path="/admin/dashboard"
          element={
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          }
        />
        <Route
          path="/admin/products"
          element={
            <MainLayout>
              <AdminProducts/>
            </MainLayout>
          }
        />
        <Route
          path="/admin/vendor"
          element={
            <MainLayout>
              <AdminVendor/>
            </MainLayout>
          }
        />
        <Route
          path="/admin/seller"
          element={
            <MainLayout>
             <AdminSeller/>
            </MainLayout>
          }
        />
          <Route
          path="/settings/profile"
          element={
            <MainLayout>
             <Profile/>
            </MainLayout>
          }
        />
        <Route
          path="/settings/change-password"
          element={
            <MainLayout>
             <ChangePassword />
            </MainLayout>
          }
        />
         <Route
          path="/settings/forget-password"
          element={
            <MainLayout>
             <ForgetPasswordForm/>
            </MainLayout>
          }
        />
      </Route>

      {/* Seller Routes */}
      <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
        <Route
          path="/seller/dashboard"
          element={
            <MainLayout>
              <SellerDashboard />
            </MainLayout>
          }
        />
      </Route>

      {/* User Routes */}
      <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
        <Route
          path="/vendor/dashboard"
          element={
            <MainLayout>
              <VendorDashboard />
            </MainLayout>
          }
        />
      </Route>

      {/* Fallback */}
      <Route
          path="/change-password"
          element={
            <CommonLayout> <ChangePassword/></CommonLayout>
            
           
          }
      />
      <Route
          path="/forget-password"
        element={
            <CommonLayout><ForgetPasswordForm/></CommonLayout>
            
             
           
          }
        />
      <Route path="*" element={<PageNotFound/>} />
    </Routes>
  );
};

export default AppRoutes;
