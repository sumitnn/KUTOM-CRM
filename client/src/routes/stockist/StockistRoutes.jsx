import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import React from "react";



const ResellerOrderRequestDetail =lazy(() => import("../../pages/ResellerOrderRequestDetail"));
const ResellerOrderRequestPage =lazy(() => import("../../pages/ResellerOrderRequestPage"));
// Lazy-loaded components
const OrderRequestDetailsPage =lazy(() => import("../../pages/OrderRequestDetailsPage"));
const OrderRequestPage =lazy(() => import("../../pages/OrderRequestPage"));
const ProtectedRoute = lazy(() => import("../ProtectedRoutes"));
const CommonProductListPage = lazy(() => import("../../pages/CommonProductListPage"));
const CommonProductDetailPage = lazy(() => import("../../pages/CommonProductDetailPage"));
const CommonMyCart = lazy(() => import("../../pages/CommonMyCart"));
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
const CommonMyStockPage = lazy(() => import("../../pages/CommonMyStockPage"));
const Report = lazy(() => import("../../pages/Report"));
// Error Boundary
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return <div className="error-fallback">Something went wrong. Please try again later.</div>;
  }

  return children;
};

const StockistRoutes = [
  // ✅ Protected routes that REQUIRE profile completion = 100%
  <Route element={<ProtectedRoute allowedRoles={["stockist"]} checkProfileCompletion={true} />} key="stockist">
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
              <CommonProductListPage role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />
      <Route
      path="/stockist/my-stocks"
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <CommonMyStockPage role="stockist" />
          </Suspense>
        </StockistMainLayout>
      }
    />
    
    {/* Reports */}
    <Route
      path="/stockist/sales-report"
      element={
        <StockistMainLayout>
          <Suspense fallback={<Spinner />}>
            <Report role="stockist" />
          </Suspense>
        </StockistMainLayout>
      }
    />
    <Route
      path="/stockist/products/:id"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <CommonProductDetailPage role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />

    {/* Reseller Management */}
    <Route
      path="/stockist/assigned-reseller"
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

    {/* order reqeust  */}
      <Route
      path="/stockist/my-order-request"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <OrderRequestPage role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />
  <Route
      path="/stockist/order-requests-details/:id"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <OrderRequestDetailsPage role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />

    {/* network order request  */}
    <Route
      path="/stockist/reseller-order-request"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <ResellerOrderRequestPage role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />
     <Route
      path="/reseller/order-request/:id"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <ResellerOrderRequestDetail role="stockist"/>
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />
    {/* Orders */}
    <Route
      path="/stockist/stockist/orders"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <OrdersManagement role="stockist" />
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
              <OrderDetailPage role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />

    {/* Wallet */}
    <Route
      path="/stockist/my-wallet"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <UserWalletPage role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />

    {/* Withdrawals */}
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
      path="/stockist/my-withdrawl-history"
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
              <CreateTopupRequest role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />
    <Route
      path="/stockist/my-topup-request"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <TopupRequestsList role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />

    {/* Cart */}
    <Route
      path="/stockist/my-cart"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <CommonMyCart role="stockist" />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />
  </Route>,

  // ✅ Routes that IGNORE profile completion (always accessible)
  <Route element={<ProtectedRoute allowedRoles={["stockist"]} checkProfileCompletion={false} />} key="stockist-no-profile-check">
    <Route
      path="/stockist/settings/profile"
      element={
        <StockistMainLayout>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <Profile />
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
              <ChangePassword />
            </Suspense>
          </ErrorBoundary>
        </StockistMainLayout>
      }
    />
    <Route
      path="/stockist/logout"
      element={
        <ErrorBoundary>
          <Suspense fallback={<Spinner />}>
            <Logout />
          </Suspense>
        </ErrorBoundary>
      }
    />
  </Route>,
];

export default StockistRoutes;
