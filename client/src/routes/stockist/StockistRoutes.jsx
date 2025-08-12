import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import React  from "react";


// Lazy-loaded components
const ProtectedRoute = lazy(() => import("../ProtectedRoutes"));
const CommonProductListPage = lazy(() => import("../../pages/CommonProductListPage"));
const CommonProductDetailPage = lazy(() => import("../../pages/CommonProductDetailPage"));
const MyCart = lazy(() => import("../../pages/MyCart"));
const Spinner = lazy(() => import("../../components/common/Spinner"));
const StockistMainLayout = lazy(() => import("../../layout/stockist/StockistMainLayout"));
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

// Error Boundary Component (simple version)
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  const handleOnError = (error, errorInfo) => {
    console.error("Error caught by Error Boundary:", error, errorInfo);
    setHasError(true);
  };

  if (hasError) {
    return <div className="error-fallback">Something went wrong. Please try again later.</div>;
  }

  return children;
};

const StockistRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["stockist"]} />} key="stockist">
    {/* Dashboard */}
    <Route
      path="/stockist/dashboard"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <StockistDashboard />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />

    {/* Products */}
    <Route 
      path="/stockist/products" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <CommonProductListPage role="stockist"/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />
    
    <Route 
      path="/stockist/products/:id" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <CommonProductDetailPage role="stockist"/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />

    {/* Reseller Management */}
    <Route 
      path="/stockist/reseller" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <StockistReseller />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      } 
    />

    {/* Order Management */}
    <Route 
      path="/stockist/orders" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <OrdersManagement role="stockist"/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      } 
    />
    
    <Route 
      path="/stockist/orders/:id" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <OrderDetailPage role="stockist"/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      } 
    />

    {/* Wallet */}
    <Route 
      path="/stockist/wallet" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <UserWalletPage role="stockist"/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      } 
    />

    {/* Withdrawal */}
    <Route
      path="/stockist/withdrawl-request"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <CreateWithdrawalRequest role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />
    
    <Route
      path="/stockist/my-withdrawl"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <WithdrawlRequestsList role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />

    {/* Topup */}
    <Route 
      path="/stockist/topup-request" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <CreateTopupRequest role="stockist"/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      } 
    />

    <Route 
      path="/stockist/my-cart" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <MyCart role="stockist"/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      } 
    />

    <Route 
      path="/stockist/my-topup" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <TopupRequestsList role="stockist"/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      } 
    />
    
    {/* Settings */}
    <Route 
      path="/stockist/settings/profile" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <Profile/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      } 
    />
    
    <Route 
      path="/stockist/settings/change-password" 
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <ChangePassword/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      } 
    />
    
    {/* Logout */}
    <Route 
      key="logout" 
      path="/stockist/logout" 
      element={
        <ErrorBoundary>
          <Suspense fallback={<Spinner />}>
            <Logout/>
          </Suspense>
        </ErrorBoundary>
      } 
    />
  </Route>
];

export default StockistRoutes;