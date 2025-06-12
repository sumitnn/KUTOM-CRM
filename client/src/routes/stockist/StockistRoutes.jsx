import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import StockistMainLayout from "../../layout/stockist/StockistMainLayout";
import StockistDashboard from "../../pages/stockist/StockistDashboard";
import Logout from "../../pages/Logout";
import Profile from "../../pages/common/Profile";
import ChangePassword from "../../components/auths/ChangePassword";
import OrdersManagement from "../../pages/OrdersManagement";
import OrderDetailPage from "../../pages/OrderDetailPage";
import UserWalletPage from "../../pages/UserWalletPage";
import StockistReseller from "../../pages/stockist/StockistReseller";
import CreateTopupRequest from "../../pages/CreateTopupRequest";
import TopupRequestsList from "../../pages/TopupRequestList";


const StockistRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["stockist"]} />} key="stockist">
    <Route
      path="/stockist/dashboard"
      element={<StockistMainLayout><StockistDashboard /></StockistMainLayout>}
    />
    <Route path="/stockist/reseller" element={<StockistMainLayout><StockistReseller /></StockistMainLayout>} />

<Route path="/stockist/orders" element={<StockistMainLayout><OrdersManagement role="stockist"/></StockistMainLayout>} />
    <Route path="/stockist/orders/:id" element={<StockistMainLayout><OrderDetailPage  role="stockist"/></StockistMainLayout>} />

    <Route path="/stockist/wallet" element={<StockistMainLayout><UserWalletPage /></StockistMainLayout>} />
    {/* topup  */}
    <Route path="/stockist/topup-request" element={<StockistMainLayout><CreateTopupRequest/></StockistMainLayout>} />
    <Route path="/stockist/my-topup" element={<StockistMainLayout><TopupRequestsList role="stockist"/></StockistMainLayout>} />
    
    <Route path="stockist/settings/profile" element={<StockistMainLayout><Profile/></StockistMainLayout>} />
    <Route path="stockist/settings/change-password" element={<StockistMainLayout><ChangePassword/></StockistMainLayout>} />
    <Route key="logout" path="/stockist/logout" element={<Logout/>} />
  </Route>
];

export default StockistRoutes;
