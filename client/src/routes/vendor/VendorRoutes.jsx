import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import React from "react";


// Components that don't need lazy loading (used in fallback or wrappers)
import Spinner from "../../components/common/Spinner";
import ProtectedRoute from "../ProtectedRoutes";
import VendorMainLayout from "../../layout/vendor/VendorMainLayout";

// Lazy-loaded page components
const OrderDetailPage = lazy(() => import("../../pages/OrderDetailPage"));
const VendorDashboard = lazy(() => import("../../pages/vendor/VendorDashboard"));
const Logout = lazy(() => import("../../pages/Logout"));
const ViewBrandsPage = lazy(() => import("../../pages/ViewBrandsPage"));
const CreateProductPage = lazy(() => import("../../pages/CreateProductPage"));
const ProductDetailsPage = lazy(() => import("../../pages/ProductDetailPage"));
const EditProductPage = lazy(() => import("../../pages/EditProductPage"));
const Profile = lazy(() => import("../../pages/common/Profile"));
const ChangePassword = lazy(() => import("../../components/auths/ChangePassword"));
const UserWalletPage = lazy(() => import("../../pages/UserWalletPage"));
const TabledProductListPage = lazy(() => import("../../pages/TabledProductListPage"));
const SalesPage = lazy(() => import("../../pages/SalesPage"));
const MyStockPage = lazy(() => import("../../pages/MyStockPage"));
const RequestedProductsPage = lazy(() => import("../../pages/RequestedProductsPage"));
const CategoryManagementPage = lazy(() => import("../../pages/CategoryManagementPage"));
const Report = lazy(() => import("../../pages/Report"));
const CreateWithdrawalRequest = lazy(() => import("../../pages/CreateWithdrawalRequest"));
const WithdrawlRequestsList = lazy(() => import("../../pages/WithdrawlRequestsList"));

const VendorRoutes = [
  // Main protected route with profile completion check
  <Route element={<ProtectedRoute allowedRoles={["vendor"]} checkProfileCompletion={true} />} key="vendor">
    {/* Dashboard */}
    <Route
      path="/vendor/dashboard"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <VendorDashboard />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Brand */}
    <Route
      path="/vendor/brand"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <ViewBrandsPage />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Category */}
    <Route
      path="/vendor/categories"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <CategoryManagementPage />
          </Suspense>
        </VendorMainLayout>
      }
    />

    {/* Products */}
    <Route
      path="/vendor/products"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <TabledProductListPage role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    <Route
      path="/vendor/requested-products"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <RequestedProductsPage role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Sales */}
    <Route
      path="/vendor/my-sales"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <SalesPage role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    <Route
      path="/vendor/my-sales/:id"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrderDetailPage role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Stocks */}
    <Route
      path="/vendor/my-stocks"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <MyStockPage role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Report */}
    <Route
      path="/vendor/sales-report"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <Report role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Product Details */}
    <Route
      path="/vendor/products/:id"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <ProductDetailsPage role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Create Product */}
    <Route
      path="/vendor/create-product"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <CreateProductPage />
          </Suspense>
        </VendorMainLayout>
      }
    />
  
    {/* Edit Product */}
    <Route
      path="/vendor/products/edit/:id"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <EditProductPage role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Withdrawal */}
    <Route
      path="/vendor/withdrawl-request"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <CreateWithdrawalRequest role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    <Route
      path="/vendor/my-withdrawl-history"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <WithdrawlRequestsList role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Wallet */}
    <Route
      path="/vendor/my-wallet"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <UserWalletPage />
          </Suspense>
        </VendorMainLayout>
      }
    />
  </Route>,

  // Routes that don't require profile completion
  <Route element={<ProtectedRoute allowedRoles={["vendor"]} checkProfileCompletion={false} />} key="vendor-no-profile-check">
    {/* Profile Settings - accessible without completion */}
    <Route
      path="/vendor/settings/profile"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <Profile />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Change Password - accessible without completion */}
    <Route
      path="/vendor/settings/change-password"
      element={
        <VendorMainLayout>
          <Suspense fallback={<Spinner />}>
            <ChangePassword role="vendor" />
          </Suspense>
        </VendorMainLayout>
      }
    />
    
    {/* Logout - accessible without completion */}
    <Route
      path="/vendor/logout"
      element={
        <Suspense fallback={<Spinner />}>
          <Logout />
        </Suspense>
      }
    />
  </Route>
];

export default VendorRoutes;