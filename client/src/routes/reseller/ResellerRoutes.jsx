import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";

// Lazy-loaded components
const Spinner = lazy(() => import("../../components/common/Spinner"));
const ResellerMainLayout = lazy(() => import("../../layout/reseller/ResellerMainLayout"));
const ProtectedRoute = lazy(() => import("../ProtectedRoutes"));
const ResellerDashboard = lazy(() => import("../../pages/reseller/ResellerDashboard"));
const Logout = lazy(() => import("../../pages/Logout"));
const CommonProductListPage = lazy(() => import("../../pages/CommonProductListPage"));
const OrdersManagement = lazy(() => import("../../pages/OrdersManagement"));
const UserWalletPage = lazy(() => import("../../pages/UserWalletPage"));
const MyCart = lazy(() => import("../../pages/MyCart"));
const CommonProductDetailPage = lazy(() => import("../../pages/CommonProductDetailPage"));
const Profile = lazy(() => import("../../pages/common/Profile"));
const ChangePassword = lazy(() => import("../../components/auths/ChangePassword"));
const OrderDetailPage = lazy(() => import("../../pages/OrderDetailPage"));
const CreateTopupRequest = lazy(() => import("../../pages/CreateTopupRequest"));
const TopupRequestsList = lazy(() => import("../../pages/TopupRequestList"));
const WithdrawlRequestsList = lazy(() => import("../../pages/WithdrawlRequestsList"));
const CreateWithdrawalRequest = lazy(() => import("../../pages/CreateWithdrawalRequest"));

const ResellerRoutes = [
  // ✅ Routes that REQUIRE profile completion (100%)
  <Route element={<ProtectedRoute allowedRoles={["reseller"]} checkProfileCompletion={true} />} key="reseller">
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
            <CommonProductListPage role="reseller" />
          </Suspense>
        </ResellerMainLayout>
      }
    />
    <Route
      path="/reseller/products/:id"
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <CommonProductDetailPage role="reseller" />
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
            <OrdersManagement role="reseller" />
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

    {/* Withdrawal */}
    <Route
      path="/reseller/withdrawl-request"
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <CreateWithdrawalRequest role="reseller" />
          </Suspense>
        </ResellerMainLayout>
      }
    />
    <Route
      path="/reseller/my-withdrawl"
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <WithdrawlRequestsList role="reseller" />
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
            <CreateTopupRequest role="reseller" />
          </Suspense>
        </ResellerMainLayout>
      }
    />
    <Route
      path="/reseller/my-topup"
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <TopupRequestsList role="reseller" />
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
            <UserWalletPage role="reseller" />
          </Suspense>
        </ResellerMainLayout>
      }
    />

    {/* Cart */}
    <Route
      path="/reseller/my-cart"
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <MyCart />
          </Suspense>
        </ResellerMainLayout>
      }
    />
  </Route>,

  // ✅ Routes that IGNORE profile completion (always accessible)
  <Route element={<ProtectedRoute allowedRoles={["reseller"]} checkProfileCompletion={false} />} key="reseller-no-profile-check">
    <Route
      path="/reseller/settings/profile"
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <Profile />
          </Suspense>
        </ResellerMainLayout>
      }
    />
    <Route
      path="/reseller/settings/change-password"
      element={
        <ResellerMainLayout>
          <Suspense fallback={<Spinner />}>
            <ChangePassword />
          </Suspense>
        </ResellerMainLayout>
      }
    />
    <Route
      path="/reseller/logout"
      element={
        <Suspense fallback={<Spinner />}>
          <Logout />
        </Suspense>
      }
    />
  </Route>,
];

export default ResellerRoutes;
