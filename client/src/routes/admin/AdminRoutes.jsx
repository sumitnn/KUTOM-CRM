// src/routes/admin/AdminRoutes.jsx
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import AdminMainLayout from "../../layout/admin/AdminMainLayout";

import AdminDashboard from "../../pages/admin/AdminDashboard";
import WalletManagementPage from "../../pages/admin/WalletManagementPage";


import AdminVendor from "../../pages/admin/AdminVendor";
import AdminStockist from "../../pages/admin/AdminStockist";
import Profile from "../../pages/common/Profile";
import ChangePassword from "../../components/auths/ChangePassword";
import Logout from "../../pages/Logout";
import ViewBrandsPage from "../../pages/ViewBrandsPage";
import CreateBrandPage from "../../pages/CreateBrandPage";
import CreateCategoryPage from "../../pages/CreateCategoryPage";
import ViewCategoriesPage from "../../pages/ViewCategoriesPage";
import CreateSubcategoryPage from "../../pages/CreateSubcategoryPage";
import ViewSubcategoriesPage from "../../pages/ViewSubcategoriesPage";
import ProductListPage from "../../pages/ProductListPage";
import ProductDetailsPage from "../../pages/ProductDetailPage";
import CreateProductPage from "../../pages/CreateProductPage";
import MyProductsPage from "../../pages/MyProductsPage";
import EditProductPage from "../../pages/EditProductPage";
import AdminReseller from "../../pages/admin/AdminReseller";
import OrdersManagement from "../../pages/OrdersManagement";
import AdminTopupPage from "../../pages/admin/AdminTopupPage";
import AdminProductApprovalPage from "../../pages/admin/AdminProductApprovalPage";

const adminRoutes = [
  <Route key="admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
    <Route path="/admin/dashboard" element={<AdminMainLayout><AdminDashboard /></AdminMainLayout>} />

     {/* brand  */}
     <Route path="/admin/create-brand" element={<AdminMainLayout><CreateBrandPage/></AdminMainLayout>}/>
    <Route
      path="/admin/brand"
      element={<AdminMainLayout><ViewBrandsPage/></AdminMainLayout>}
    />
    {/* category  */}
 
    <Route
      path="/admin/categories"
      element={<AdminMainLayout><ViewCategoriesPage/></AdminMainLayout>}
    />
    {/* sub category  */}

    <Route path="/admin/subcategories" element={<AdminMainLayout><ViewSubcategoriesPage /></AdminMainLayout>} />

      {/* products  */}
      <Route path="/admin/products" element={<AdminMainLayout><ProductListPage role="admin"/></AdminMainLayout>}/>
      <Route path="/admin/product-requests" element={<AdminMainLayout><AdminProductApprovalPage/></AdminMainLayout>}/>
    <Route path="/admin/products/:id" element={<AdminMainLayout><ProductDetailsPage role="admin"/></AdminMainLayout>}/>
    <Route path="/admin/products/edit/:id" element={<AdminMainLayout><EditProductPage role="admin"/></AdminMainLayout>} />


    <Route path="/admin/wallet" element={<AdminMainLayout><WalletManagementPage /></AdminMainLayout>} />
    {/* <Route path="/admin/orders" element={<AdminMainLayout><OrdersManagement /></AdminMainLayout>} /> */}
    <Route path="/admin/vendor" element={<AdminMainLayout><AdminVendor /></AdminMainLayout>} />
    <Route path="/admin/stockist" element={<AdminMainLayout><AdminStockist /></AdminMainLayout>} />
    <Route path="/admin/reseller" element={<AdminMainLayout><AdminReseller /></AdminMainLayout>} />

    {/* topup  */}
    <Route path="/admin/topup" element={<AdminMainLayout><AdminTopupPage /></AdminMainLayout>} />


    <Route path="/admin/settings/profile" element={<AdminMainLayout><Profile /></AdminMainLayout>} />
    <Route path="/admin/settings/change-password" element={<AdminMainLayout><ChangePassword /></AdminMainLayout>} />
    <Route key="logout" path="/admin/logout" element={<Logout />} />
  </Route>
];

export default adminRoutes;
