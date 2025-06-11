
import ResellerMainLayout from "../../layout/reseller/ResellerMainLayout";
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import Logout from "../../pages/Logout";
import ResellerDashboard from "../../pages/reseller/ResellerDashboard";
import ProductListPage from "../../pages/ProductListPage";
import OrdersManagement from "../../pages/OrdersManagement";
import UserWalletPage from "../../pages/UserWalletPage";
import MyCart from "../../pages/MyCart";
import ProductDetailsPage from "../../pages/ProductDetailPage";
import Profile from "../../pages/common/Profile";
import ChangePassword from "../../components/auths/ChangePassword";
import OrderDetailPage from "../../pages/OrderDetailPage";
const ResellerRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["reseller"]} />} key="reseller">
    <Route
      path="/reseller/dashboard"
      element={<ResellerMainLayout><ResellerDashboard/></ResellerMainLayout>}
    />
    
    {/* products  */}
    <Route path="/reseller/products" element={<ResellerMainLayout><ProductListPage role="reseller"/></ResellerMainLayout>}/>
    <Route path="/reseller/products/:id" element={<ResellerMainLayout><ProductDetailsPage role="reseller"/></ResellerMainLayout>}/>

    
    {/* order  */}
    <Route path="/reseller/orders" element={<ResellerMainLayout><OrdersManagement role="reseller"/></ResellerMainLayout>} />
    <Route path="/reseller/orders/:id" element={<ResellerMainLayout><OrderDetailPage /></ResellerMainLayout>} />
    
    {/* wallet  */}
    <Route path="/reseller/wallet" element={<ResellerMainLayout><UserWalletPage/></ResellerMainLayout>} />
    <Route path="/reseller/my-cart" element={<ResellerMainLayout><MyCart/></ResellerMainLayout>} />
    
    <Route path="reseller/settings/profile" element={<ResellerMainLayout><Profile/></ResellerMainLayout>} />
    <Route path="reseller/settings/change-password" element={<ResellerMainLayout><ChangePassword/></ResellerMainLayout>} />

    <Route key="logout" path="/reseller/logout" element={<Logout/>} />
  </Route>
];

export default ResellerRoutes;
