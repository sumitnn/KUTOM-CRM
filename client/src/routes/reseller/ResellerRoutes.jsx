
import ResellerMainLayout from "../../layout/reseller/ResellerMainLayout";
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoutes";
import Logout from "../../pages/Logout";
import ResellerDashboard from "../../pages/reseller/ResellerDashboard";

const ResellerRoutes = [
  <Route element={<ProtectedRoute allowedRoles={["reseller"]} />} key="reseller">
    <Route
      path="/reseller/dashboard"
      element={<ResellerMainLayout><ResellerDashboard/></ResellerMainLayout>}
    />
    <Route key="logout" path="/reseller/logout" element={<Logout/>} />
  </Route>
];

export default ResellerRoutes;
