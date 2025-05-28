
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
const ResellerRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["reseller"]} />} key="reseller">
    <Route
      path="/reseller/dashboard"
      element={<ResellerMainLayout><ResellerDashboard/></ResellerMainLayout>}
    />
    
    {/* products  */}
    <Route path="/reseller/products" element={<ResellerMainLayout><ProductListPage/></ResellerMainLayout>}/>
    <Route path="/reseller/product/:id" element={<ResellerMainLayout><ProductDetailsPage/></ResellerMainLayout>}/>

    
    {/* order  */}
    <Route path="/reseller/orders" element={<ResellerMainLayout><OrdersManagement /></ResellerMainLayout>} />
    
    {/* wallet  */}
    <Route path="/reseller/wallet" element={<ResellerMainLayout><UserWalletPage/></ResellerMainLayout>} />
    <Route path="/reseller/my-cart" element={<ResellerMainLayout><MyCart/></ResellerMainLayout>} />
    


    <Route key="logout" path="/reseller/logout" element={<Logout/>} />
  </Route>
];

export default ResellerRoutes;
