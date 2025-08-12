import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";



// Lazy-loaded components
const ProtectedRoute=lazy(()=>"../ProtectedRoutes")
const CommonProductListPage=lazy(()=>"../../pages/CommonProductListPage")
const CommonProductDetailPage=lazy(()=>"../../pages/CommonProductDetailPage")
const MyCart=lazy(()=>"../../pages/MyCart")
const Spinner=lazy(()=>"../../components/common/Spinner")
const StockistMainLayout = Lazy(() => "../../layout/stockist/StockistMainLayout");
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
const WithdrawlRequestsList = lazy(() => import("../../pages/WithdrawlRequestsList"));
const CreateWithdrawalRequest = lazy(() => import("../../pages/CreateWithdrawalRequest"));

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

    <Route 
      path="/stockist/products" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <CommonProductListPage role="stockist"/>
          </Suspense>
        </StockistMainLayout>
      }
    />
    <Route 
      path="/stockist/products/:id" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <CommonProductDetailPage role="stockist"/>
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
            <UserWalletPage role="stockist"/>
          </Suspense>
        </StockistMainLayout>
      } 
    />

      {/* Withdrawal */}
    <Route
      path="/stockist/withdrawl-request"
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <CreateWithdrawalRequest role="stockist" />
          </Suspense>
        </StockistMainLayout>
      }
    />
    
    <Route
      path="/stockist/my-withdrawl"
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <WithdrawlRequestsList role="stockist" />
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
            <CreateTopupRequest role="stockist"/>
          </Suspense>
        </StockistMainLayout>
      } 
    />

     <Route 
      path="/stockist/my-cart" 
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            
            <MyCart role="stockist"/>
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