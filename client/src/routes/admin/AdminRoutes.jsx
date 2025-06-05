// src/routes/admin/AdminRoutes.jsx
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import AdminMainLayout from "../../layout/admin/AdminMainLayout";

import AdminDashboard from "../../pages/admin/AdminDashboard";
import WalletManagementPage from "../../pages/admin/WalletManagementPage";

import OrderManagementPage from "../../pages/admin/OrderManagementPage";
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
      path="/admin/create-category"
      element={<AdminMainLayout><CreateCategoryPage/></AdminMainLayout>}
    />
    <Route
      path="/admin/categories"
      element={<AdminMainLayout><ViewCategoriesPage/></AdminMainLayout>}
    />
    {/* sub category  */}
    <Route
      path="/admin/create-subcategory"
      element={<AdminMainLayout><CreateSubcategoryPage/></AdminMainLayout>}
    />
    <Route path="/admin/subcategories" element={<AdminMainLayout><ViewSubcategoriesPage /></AdminMainLayout>} />

      {/* products  */}
      <Route path="/admin/products" element={<AdminMainLayout><ProductListPage role="admin"/></AdminMainLayout>}/>
    <Route path="/admin/products/:id" element={<AdminMainLayout><ProductDetailsPage /></AdminMainLayout>}/>
    <Route path="/admin/create-product" element={<AdminMainLayout><CreateProductPage/></AdminMainLayout>}/>
    <Route path="/admin/my-products" element={<AdminMainLayout><MyProductsPage role="admin"/></AdminMainLayout>} />
    <Route path="/admin/products/edit/:id" element={<AdminMainLayout><EditProductPage role="admin"/></AdminMainLayout>} />


    <Route path="/admin/wallet" element={<AdminMainLayout><WalletManagementPage /></AdminMainLayout>} />
    <Route path="/admin/orders" element={<AdminMainLayout><OrderManagementPage /></AdminMainLayout>} />
    <Route path="/admin/vendor" element={<AdminMainLayout><AdminVendor /></AdminMainLayout>} />
    <Route path="/admin/stockist" element={<AdminMainLayout><AdminStockist /></AdminMainLayout>} />
    <Route path="/settings/profile" element={<AdminMainLayout><Profile /></AdminMainLayout>} />
    <Route path="/settings/change-password" element={<AdminMainLayout><ChangePassword /></AdminMainLayout>} />
    <Route key="logout" path="/admin/logout" element={<Logout />} />
  </Route>
];

export default adminRoutes;
