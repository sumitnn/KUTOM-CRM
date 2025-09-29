import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";



// Lazy-loaded page components
const OrderRequestReport = lazy(() => import("../../pages/OrderRequestReport"));
const OrderRequestDetailsPage = lazy(() => import("../../pages/OrderRequestDetailsPage"));
const OrderRequestPage = lazy(() => import("../../pages/OrderRequestPage"));
const AdminMainLayout = lazy(() => import("../../layout/admin/AdminMainLayout"));
const ProtectedRoute = lazy(() => import("../ProtectedRoutes"));
const Spinner = lazy(() => import("../../components/common/Spinner"));


const AdminMyProduct = lazy(() => import("../../pages/admin/AdminMyProduct"));
const OrderDetailPage = lazy(() => import("../../pages/OrderDetailPage"));
const AdminOrderRequestPage = lazy(() => import("../../pages/AdminOrderRequestPage"));
const ViewProductPage = lazy(() => import("../../pages/ViewProductPage"));
const CommonMyStockPage = lazy(() => import("../../pages/CommonMyStockPage"));
const Report = lazy(() => import("../../pages/Report"));
const AdminWithdrawalRequest = lazy(() => import("../../pages/admin/AdminWithdrawalRequest"));
const AdminOrderManagementPage = lazy(() => import("../../pages/admin/AdminOrderManagementPage"));
const AdminDashboard = lazy(() => import("../../pages/admin/AdminDashboard"));
const WalletManagementPage = lazy(() => import("../../pages/admin/WalletManagementPage"));
const AdminVendor = lazy(() => import("../../pages/admin/AdminVendor"));
const AdminStockist = lazy(() => import("../../pages/admin/AdminStockist"));
const Profile = lazy(() => import("../../pages/common/Profile"));
const ChangePassword = lazy(() => import("../../components/auths/ChangePassword"));
const Logout = lazy(() => import("../../pages/Logout"));
const ViewBrandsPage = lazy(() => import("../../pages/ViewBrandsPage"));
const CreateBrandPage = lazy(() => import("../../pages/CreateBrandPage"));
const ViewCategoriesPage = lazy(() => import("../../pages/ViewCategoriesPage"));
const ViewSubcategoriesPage = lazy(() => import("../../pages/ViewSubcategoriesPage"));
const ProductListPage = lazy(() => import("../../pages/ProductListPage"));
const ProductDetailsPage = lazy(() => import("../../pages/ProductDetailPage"));
const EditProductPage = lazy(() => import("../../pages/EditProductPage"));
const AdminReseller = lazy(() => import("../../pages/admin/AdminReseller"));
const AdminTopupPage = lazy(() => import("../../pages/admin/AdminTopupPage"));
const AdminProductApprovalPage = lazy(() => import("../../pages/admin/AdminProductApprovalPage"));
const MyCart = lazy(() => import("../../pages/MyCart"));

const AdminRoutes = [
  <Route key="admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
    {/* Dashboard */}
    <Route 
      path="/admin/dashboard" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminDashboard />
          </Suspense>
        </AdminMainLayout>
      } 
    />

    {/* Brand Routes */}
    <Route 
      path="/admin/create-brand" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <CreateBrandPage />
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route
      path="/admin/brand"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ViewBrandsPage />
          </Suspense>
        </AdminMainLayout>
      }
    />
    
    {/* Category Routes */}
    <Route
      path="/admin/categories"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ViewCategoriesPage />
          </Suspense>
        </AdminMainLayout>
      }
    />
    
    {/* Subcategory Routes */}
    <Route 
      path="/admin/subcategories" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ViewSubcategoriesPage />
          </Suspense>
        </AdminMainLayout>
      } 
    />

    {/* Stock Management */}
    <Route
      path="/admin/my-stocks"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <CommonMyStockPage role="admin" />
          </Suspense>
        </AdminMainLayout>
      }
    />
    
    {/* Reports */}
    <Route
      path="/admin/reseller-sales-report"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <Report role="admin" />
          </Suspense>
        </AdminMainLayout>
      }
    />
     <Route
      path="/admin/stockist-sales-report"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrderRequestReport/>
          </Suspense>
        </AdminMainLayout>
      }
    />
    {/* order reqeust  stockist*/}
    <Route
      path="/admin/stockist-order-request"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrderRequestPage role="admin" />
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route
      path="/order-requests-details/:id"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrderRequestDetailsPage role="admin" />
          </Suspense>
        </AdminMainLayout>
      }
    />

    {/* Order Management */}
    <Route
      path="/admin/order-requests"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminOrderRequestPage />
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route 
      path="/admin/orders-request/:id" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrderDetailPage role="admin" />
          </Suspense>
        </AdminMainLayout>
      } 
    />
    <Route 
      path="/admin/orders" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminOrderManagementPage />
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route 
      path="/admin/orders/:id" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <OrderDetailPage role="admin" />
          </Suspense>
        </AdminMainLayout>
      }
    />

    {/* Product Management */}
    <Route 
      path="/admin/products" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ProductListPage role="admin" />
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route 
      path="/admin/product-requests" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminProductApprovalPage />
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route 
      path="/admin/products/:id" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ProductDetailsPage role="admin" />
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route 
      path="/view/product/:id" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ViewProductPage role="admin" />
          </Suspense>
        </AdminMainLayout>
      }
    />
   <Route 
      path="/admin/my-products" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminMyProduct/>
          </Suspense>
        </AdminMainLayout>
      }
    />

    <Route 
      path="/admin/products/edit/:id" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <EditProductPage role="admin" />
          </Suspense>
        </AdminMainLayout>
      } 
    />

    {/* Financial Management */}
    <Route 
      path="/admin/wallet" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <WalletManagementPage />
          </Suspense>
        </AdminMainLayout>
      } 
    />
    <Route 
      path="/admin/topup" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminTopupPage />
          </Suspense>
        </AdminMainLayout>
      } 
    />
    <Route 
      path="/admin/withdrawal-request" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminWithdrawalRequest />
          </Suspense>
        </AdminMainLayout>
      } 
    />

    {/* User Management */}
    <Route 
      path="/admin/vendor" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminVendor />
          </Suspense>
        </AdminMainLayout>
      } 
    />
    <Route 
      path="/admin/stockist" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminStockist />
          </Suspense>
        </AdminMainLayout>
      } 
    />
    <Route 
      path="/admin/reseller" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminReseller />
          </Suspense>
        </AdminMainLayout>
      } 
    />

    {/* Shopping Cart */}
    <Route 
      path="/admin/my-cart" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <MyCart role="admin" />
          </Suspense>
        </AdminMainLayout>
      } 
    />

    {/* Settings */}
    <Route 
      path="/admin/settings/profile" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <Profile />
          </Suspense>
        </AdminMainLayout>
      } 
    />
    <Route 
      path="/admin/settings/change-password" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ChangePassword role="admin" />
          </Suspense>
        </AdminMainLayout>
      } 
    />
    
    {/* Logout */}
    <Route 
      path="/admin/logout" 
      element={
        <Suspense fallback={<Spinner />}>
          <Logout />
        </Suspense>
      } 
    />
  </Route>
];

export default AdminRoutes;