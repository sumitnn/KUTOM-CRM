import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import VendorDashboard from "../../pages/vendor/VendorDashboard";
import VendorMainLayout from "../../layout/vendor/VendorMainLayout";
import Logout from "../../pages/Logout";

import ViewBrandsPage from "../../pages/ViewBrandsPage";


import CreateProductPage from "../../pages/CreateProductPage";

import ProductDetailsPage from "../../pages/ProductDetailPage";
import EditProductPage from "../../pages/EditProductPage";
import Profile from "../../pages/common/Profile";
import ChangePassword from "../../components/auths/ChangePassword";
import UserWalletPage from "../../pages/UserWalletPage";

import TabledProductListPage from "../../pages/TabledProductListPage";
import SalesPage from "../../pages/SalesPage";
import MyStockPage from "../../pages/MyStockPage";
import RequestedProductsPage from "../../pages/RequestedProductsPage";
import CategoryManagementPage from "../../pages/CategoryManagementPage";
import Report from "../../pages/Report";
import CreateWithdrawalRequest from "../../pages/CreateWithdrawalRequest";
import WithdrawlRequestsList from "../../pages/WithdrawlRequestsList";


const VendorRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["vendor"]} />} key="vendor">
    <Route
      path="/vendor/dashboard"
      element={<VendorMainLayout><VendorDashboard /></VendorMainLayout>}
    />
    {/* brand  */}
    <Route
      path="/vendor/brand"
      element={<VendorMainLayout><ViewBrandsPage/></VendorMainLayout>}
    />
    {/* category  */}
    <Route
      path="/vendor/categories"
      element={<VendorMainLayout><CategoryManagementPage/></VendorMainLayout>}
    />

    

    {/* products  */}
    <Route path="/vendor/products" element={<VendorMainLayout><TabledProductListPage role="vendor" /></VendorMainLayout>} />
    
    <Route path="/vendor/requested-products" element={<VendorMainLayout><RequestedProductsPage role="vendor"/></VendorMainLayout>}/>
    <Route path="/vendor/my-sales" element={<VendorMainLayout><SalesPage role="vendor"/></VendorMainLayout>}/>
    <Route path="/vendor/my-stocks" element={<VendorMainLayout><MyStockPage role="vendor" /></VendorMainLayout>} />
    <Route path="/vendor/report" element={<VendorMainLayout><Report role="vendor" /></VendorMainLayout>} />
    
    <Route path="/vendor/products/:id" element={<VendorMainLayout><ProductDetailsPage role="vendor"/></VendorMainLayout>}/>
    <Route path="/vendor/create-product" element={<VendorMainLayout><CreateProductPage/></VendorMainLayout>}/>
  
    <Route path="/vendor/products/edit/:id" element={<VendorMainLayout><EditProductPage role="vendor" /></VendorMainLayout>} />
    
    {/* topup  */}
    {/* <Route path="/vendor/topup-request" element={<VendorMainLayout><CreateTopupRequest role="vendor"/></VendorMainLayout>} />
    <Route path="/vendor/my-topup" element={<VendorMainLayout><TopupRequestsList role="vendor" /></VendorMainLayout>} /> */}
    
    {/* withdrawl  */}
    <Route path="/vendor/withdrawl-request" element={<VendorMainLayout><CreateWithdrawalRequest role="vendor"/></VendorMainLayout>} />
    <Route path="/vendor/my-withdrawl" element={<VendorMainLayout><WithdrawlRequestsList role="vendor" /></VendorMainLayout>} />


    <Route path="vendor/settings/profile" element={<VendorMainLayout><Profile/></VendorMainLayout>} />
    <Route path="vendor/settings/change-password" element={<VendorMainLayout><ChangePassword role="vendor"/></VendorMainLayout>} />
    <Route path="/vendor/wallet" element={<VendorMainLayout><UserWalletPage/></VendorMainLayout>} />
    
    <Route key="logout" path="/vendor/logout" element={<Logout/>} />
  </Route>
];

export default VendorRoutes;