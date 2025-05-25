
import ResellerMainLayout from "../../layout/reseller/ResellerMainLayout";
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import Logout from "../../pages/Logout";
import ResellerDashboard from "../../pages/reseller/ResellerDashboard";
import CreateBrandPage from "../../pages/CreateBrandPage";
import ViewBrandsPage from "../../pages/ViewBrandsPage";
import CreateCategoryPage from "../../pages/CreateCategoryPage";
import ViewCategoriesPage from "../../pages/ViewCategoriesPage";
import CreateSubcategoryPage from "../../pages/CreateSubcategoryPage";
import ViewSubcategoriesPage from "../../pages/ViewSubcategoriesPage";
import ProductListPage from "../../pages/ProductListPage";
import CreateProductPage from "../../pages/CreateProductPage";
import MyProductsPage from "../../pages/MyProductsPage";
import ProductDetailsPage from "../../pages/ProductDetailPage";
import OrdersManagement from "../../pages/OrdersManagement";
import UserWalletPage from "../../pages/UserWalletPage";
import MyCart from "../../pages/MyCart";

const ResellerRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["reseller"]} />} key="reseller">
    <Route
      path="/reseller/dashboard"
      element={<ResellerMainLayout><ResellerDashboard/></ResellerMainLayout>}
    />
    <Route
      path="/reseller/create-brand"
      element={<ResellerMainLayout><CreateBrandPage/></ResellerMainLayout>}
    />
    <Route
      path="/reseller/brand"
      element={<ResellerMainLayout><ViewBrandsPage/></ResellerMainLayout>}
    />
    <Route
      path="/reseller/create-category"
      element={<ResellerMainLayout><CreateCategoryPage/></ResellerMainLayout>}
    />
    <Route
      path="/reseller/categories"
      element={<ResellerMainLayout><ViewCategoriesPage/></ResellerMainLayout>}
    />
    <Route
      path="/reseller/create-subcategory"
      element={<ResellerMainLayout><CreateSubcategoryPage/></ResellerMainLayout>}
    />
    <Route path="/reseller/subcategories" element={<ResellerMainLayout><ViewSubcategoriesPage /></ResellerMainLayout>} />
    {/* products  */}
    <Route path="/reseller/products" element={<ResellerMainLayout><ProductListPage/></ResellerMainLayout>}/>
    <Route path="/reseller/product/:id" element={<ResellerMainLayout><ProductDetailsPage/></ResellerMainLayout>}/>
    <Route path="/reseller/create-product" element={<ResellerMainLayout><CreateProductPage/></ResellerMainLayout>}/>
    <Route path="/reseller/my-products" element={<ResellerMainLayout><MyProductsPage /></ResellerMainLayout>} />
    
    {/* order  */}
    <Route path="/reseller/orders" element={<ResellerMainLayout><OrdersManagement /></ResellerMainLayout>} />
    
    {/* wallet  */}
    <Route path="/reseller/wallet" element={<ResellerMainLayout><UserWalletPage/></ResellerMainLayout>} />
    <Route path="/reseller/my-cart" element={<ResellerMainLayout><MyCart/></ResellerMainLayout>} />
    


    <Route key="logout" path="/reseller/logout" element={<Logout/>} />
  </Route>
];

export default ResellerRoutes;
