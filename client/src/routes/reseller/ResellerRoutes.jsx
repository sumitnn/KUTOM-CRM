import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import ResellerMainLayout from "../../layout/reseller/ResellerMainLayout";
import Spinner from "../../components/common/Spinner"; // Make sure you have this component

// Lazy-loaded components
const ResellerDashboard = lazy(() => import("../../pages/reseller/ResellerDashboard"));
const Logout = lazy(() => import("../../pages/Logout"));
const ProductListPage = lazy(() => import("../../pages/ProductListPage"));
const OrdersManagement = lazy(() => import("../../pages/OrdersManagement"));
const UserWalletPage = lazy(() => import("../../pages/UserWalletPage"));
const MyCart = lazy(() => import("../../pages/MyCart"));
const ProductDetailsPage = lazy(() => import("../../pages/ProductDetailPage"));
const Profile = lazy(() => import("../../pages/common/Profile"));
const ChangePassword = lazy(() => import("../../components/auths/ChangePassword"));
const OrderDetailPage = lazy(() => import("../../pages/OrderDetailPage"));
const CreateTopupRequest = lazy(() => import("../../pages/CreateTopupRequest"));
const TopupRequestsList = lazy(() => import("../../pages/TopupRequestList"));

const ResellerRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["reseller"]} />} key="reseller">
    {/* Dashboard */}
    <Route
      path="/reseller/dashboard"
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <ResellerDashboard />
          </Suspense>
        </ResellerMainLayout>
      }
    />
    
    {/* Products */}
    <Route 
      path="/reseller/products" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <ProductListPage role="reseller"/>
          </Suspense>
        </ResellerMainLayout>
      }
    />
    <Route 
      path="/reseller/products/:id" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <ProductDetailsPage role="reseller"/>
          </Suspense>
        </ResellerMainLayout>
      }
    />

    {/* Orders */}
    <Route 
      path="/reseller/orders" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrdersManagement role="reseller"/>
          </Suspense>
        </ResellerMainLayout>
      } 
    />
    <Route 
      path="/reseller/orders/:id" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrderDetailPage role="reseller" />
          </Suspense>
        </ResellerMainLayout>
      } 
    />
    
    {/* Topup */}
    <Route 
      path="/reseller/topup-request" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <CreateTopupRequest/>
          </Suspense>
        </ResellerMainLayout>
      } 
    />
    <Route 
      path="/reseller/my-topup" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <TopupRequestsList role="reseller"/>
          </Suspense>
        </ResellerMainLayout>
      } 
    />

    {/* Wallet */}
    <Route 
      path="/reseller/wallet" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <UserWalletPage/>
          </Suspense>
        </ResellerMainLayout>
      } 
    />
    <Route 
      path="/reseller/my-cart" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <MyCart/>
          </Suspense>
        </ResellerMainLayout>
      } 
    />
    
    {/* Settings */}
    <Route 
      path="reseller/settings/profile" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <Profile/>
          </Suspense>
        </ResellerMainLayout>
      } 
    />
    <Route 
      path="reseller/settings/change-password" 
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <ChangePassword/>
          </Suspense>
        </ResellerMainLayout>
      } 
    />

    {/* Logout */}
    <Route 
      key="logout" 
      path="/reseller/logout" 
      element={
        <Suspense fallback={<Spinner />}>
          <Logout/>
        </Suspense>
      } 
    />
  </Route>
];

export default ResellerRoutes;