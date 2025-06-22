import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import AdminMainLayout from "../../layout/admin/AdminMainLayout";
import Spinner from "../../components/common/Spinner";

// Lazy-loaded components
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
const CreateCategoryPage = lazy(() => import("../../pages/CreateCategoryPage"));
const CreateSubcategoryPage = lazy(() => import("../../pages/CreateSubcategoryPage"));
const ViewSubcategoriesPage = lazy(() => import("../../pages/ViewSubcategoriesPage"));
const ProductListPage = lazy(() => import("../../pages/ProductListPage"));
const ProductDetailsPage = lazy(() => import("../../pages/ProductDetailPage"));
const CreateProductPage = lazy(() => import("../../pages/CreateProductPage"));
const MyProductsPage = lazy(() => import("../../pages/MyProductsPage"));
const EditProductPage = lazy(() => import("../../pages/EditProductPage"));
const AdminReseller = lazy(() => import("../../pages/admin/AdminReseller"));
const OrdersManagement = lazy(() => import("../../pages/OrdersManagement"));
const AdminTopupPage = lazy(() => import("../../pages/admin/AdminTopupPage"));
const AdminProductApprovalPage = lazy(() => import("../../pages/admin/AdminProductApprovalPage"));

const AdminRoutes = [
  <Route key="admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
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

    {/* brand routes */}
    <Route 
      path="/admin/create-brand" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <CreateBrandPage/>
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route
      path="/admin/brand"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ViewBrandsPage/>
          </Suspense>
        </AdminMainLayout>
      }
    />
    
    {/* category routes */}
    <Route
      path="/admin/categories"
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ViewCategoriesPage/>
          </Suspense>
        </AdminMainLayout>
      }
    />
    
    {/* subcategory routes */}
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

    {/* product routes */}
    <Route 
      path="/admin/products" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ProductListPage role="admin"/>
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route 
      path="/admin/product-requests" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <AdminProductApprovalPage/>
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route 
      path="/admin/products/:id" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <ProductDetailsPage role="admin"/>
          </Suspense>
        </AdminMainLayout>
      }
    />
    <Route 
      path="/admin/products/edit/:id" 
      element={
        <AdminMainLayout>
          <Suspense fallback={<Spinner />}>
            <EditProductPage role="admin"/>
          </Suspense>
        </AdminMainLayout>
      } 
    />

    {/* wallet */}
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
    
    {/* user management */}
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

    {/* topup */}
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

    {/* settings */}
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
            <ChangePassword />
          </Suspense>
        </AdminMainLayout>
      } 
    />
    
    {/* logout */}
    <Route 
      key="logout" 
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