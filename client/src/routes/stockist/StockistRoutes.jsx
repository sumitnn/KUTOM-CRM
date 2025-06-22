import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import StockistMainLayout from "../../layout/stockist/StockistMainLayout";
import Spinner from "../../components/common/Spinner";

// Lazy-loaded components
const StockistDashboard = lazy(() => import("../../pages/stockist/StockistDashboard"));
const Logout = lazy(() => import("../../pages/Logout"));
const Profile = lazy(() => import("../../pages/common/Profile"));
const ChangePassword = lazy(() => import("../../components/auths/ChangePassword"));
const OrdersManagement = lazy(() => import("../../pages/OrdersManagement"));
const OrderDetailPage = lazy(() => import("../../pages/OrderDetailPage"));
const UserWalletPage = lazy(() => import("../../pages/UserWalletPage"));
const StockistReseller = lazy(() => import("../../pages/stockist/StockistReseller"));
const CreateTopupRequest = lazy(() => import("../../pages/CreateTopupRequest"));
const TopupRequestsList = lazy(() => import("../../pages/TopupRequestList"));

const StockistRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["stockist"]} />} key="stockist">
    {/* Dashboard */}
    <Route
      path="/stockist/dashboard"
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <StockistDashboard />
          </Suspense>
        </StockistMainLayout>
      }
    />

    {/* Reseller Management */}
    <Route 
      path="/stockist/reseller" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <StockistReseller />
          </Suspense>
        </StockistMainLayout>
      } 
    />

    {/* Order Management */}
    <Route 
      path="/stockist/orders" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrdersManagement role="stockist"/>
          </Suspense>
        </StockistMainLayout>
      } 
    />
    <Route 
      path="/stockist/orders/:id" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrderDetailPage role="stockist"/>
          </Suspense>
        </StockistMainLayout>
      } 
    />

    {/* Wallet */}
    <Route 
      path="/stockist/wallet" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <UserWalletPage />
          </Suspense>
        </StockistMainLayout>
      } 
    />

    {/* Topup */}
    <Route 
      path="/stockist/topup-request" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <CreateTopupRequest/>
          </Suspense>
        </StockistMainLayout>
      } 
    />
    <Route 
      path="/stockist/my-topup" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <TopupRequestsList role="stockist"/>
          </Suspense>
        </StockistMainLayout>
      } 
    />
    
    {/* Settings */}
    <Route 
      path="stockist/settings/profile" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <Profile/>
          </Suspense>
        </StockistMainLayout>
      } 
    />
    <Route 
      path="stockist/settings/change-password" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <ChangePassword/>
          </Suspense>
        </StockistMainLayout>
      } 
    />
    
    {/* Logout */}
    <Route 
      key="logout" 
      path="/stockist/logout" 
      element={
        <Suspense fallback={<Spinner />}>
          <Logout/>
        </Suspense>
      } 
    />
  </Route>
];

export default StockistRoutes;