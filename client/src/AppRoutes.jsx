// src/AppRoutes.jsx
import { Routes } from "react-router-dom";
import commonRoutes from "./routes/CommonRoutes";
import adminRoutes from "./routes/admin/AdminRoutes";
// import vendorRoutes from "./routes/vendor/VendorRoutes";
import stockistRoutes from "./routes/stockist/StockistRoutes";
import resellerRoutes from "./routes/reseller/ResellerRoutes";

const AppRoutes = () => (
  <Routes>
    {commonRoutes}
    {adminRoutes}
    {/* {vendorRoutes} */}
    {stockistRoutes}
    {resellerRoutes}
  </Routes>
);

export default AppRoutes;
