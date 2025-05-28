import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import VendorDashboard from "../../pages/vendor/VendorDashboard";
import VendorMainLayout from "../../layout/vendor/VendorMainLayout";
import Logout from "../../pages/Logout";
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


const VendorRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["vendor"]} />} key="vendor">
    <Route
      path="/vendor/dashboard"
      element={<VendorMainLayout><VendorDashboard /></VendorMainLayout>}
    />
    {/* brand  */}
    <Route
      path="/vendor/create-brand"
      element={<VendorMainLayout><CreateBrandPage/></VendorMainLayout>}
    />
    <Route
      path="/vendor/brand"
      element={<VendorMainLayout><ViewBrandsPage/></VendorMainLayout>}
    />
    {/* category  */}
    <Route
      path="/vendor/create-category"
      element={<VendorMainLayout><CreateCategoryPage/></VendorMainLayout>}
    />
    <Route
      path="/vendor/categories"
      element={<VendorMainLayout><ViewCategoriesPage/></VendorMainLayout>}
    />
    {/* sub category  */}
    <Route
      path="/vendor/create-subcategory"
      element={<VendorMainLayout><CreateSubcategoryPage/></VendorMainLayout>}
    />
    <Route path="/vendor/subcategories" element={<VendorMainLayout><ViewSubcategoriesPage /></VendorMainLayout>} />

    {/* products  */}
    <Route path="/vendor/products" element={<VendorMainLayout><ProductListPage/></VendorMainLayout>}/>
    <Route path="/vendor/product/:id" element={<VendorMainLayout><ProductDetailsPage/></VendorMainLayout>}/>
    <Route path="/vendor/create-product" element={<VendorMainLayout><CreateProductPage/></VendorMainLayout>}/>
    <Route path="/vendor/my-products" element={<VendorMainLayout><MyProductsPage /></VendorMainLayout>} />

    
    <Route key="logout" path="/vendor/logout" element={<Logout/>} />
  </Route>
];

export default VendorRoutes;