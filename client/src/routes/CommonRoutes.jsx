import { Route } from "react-router-dom";
import CommonLayout from "../layout/CommonLayout";
import Login from "../components/auths/Login";
import RedirectIfAuthenticatedRoute from "../routes/RedirectIfAuthenticatedRoute";
import ResetPassword from "../components/auths/ResetPassword";
import ForgetPasswordForm from "../components/auths/ForgetPasswordForm";
import PageNotFound from "../PageNotFound";
import HomePage from "../components/common/HomePage";
import BusinessPage from "../components/common/BusinessPage";
import ContactUsPage from "../components/common/ContactUsPage";

const commonRoutes = [
  
   <Route
    key="home"
    path="/"
    element={
      <CommonLayout>
        <HomePage />
      </CommonLayout>
    }
  />,
  <Route
    key="business"
    path="/business"
    element={
      <CommonLayout>
        <BusinessPage />
      </CommonLayout>
    }
  />,
  <Route
    key="contact-us"
    path="/contact-us"
    element={
      <CommonLayout>
        <ContactUsPage />
      </CommonLayout>
    }
  />,
  <Route
    key="login"
    path="/login"
    element={
      <RedirectIfAuthenticatedRoute>
        <CommonLayout><Login /></CommonLayout>
      </RedirectIfAuthenticatedRoute>
    }
  />,
  <Route
    key="forget-password"
    path="/forget-password"
    element={<CommonLayout><ForgetPasswordForm /></CommonLayout>}
  />,
  <Route
    key="reset-password"
    path="/reset-password/:userid/:token"
    element={<CommonLayout><ResetPassword /></CommonLayout>}
  />,
  <Route
    key="not-found"
    path="*"
    element={<PageNotFound />}
  />,
];

export default commonRoutes;
