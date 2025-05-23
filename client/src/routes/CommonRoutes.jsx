import { Route } from "react-router-dom";
import CommonLayout from "../layout/CommonLayout";
import Login from "../components/auths/Login";
import RedirectIfAuthenticatedRoute from "../routes/RedirectIfAuthenticatedRoute";
import ResetPassword from "../components/auths/ResetPassword";
import ForgetPasswordForm from "../components/auths/ForgetPasswordForm";
import PageNotFound from "../PageNotFound";

const commonRoutes = [
  <Route
    key="home"
    path="/"
    element={
      <RedirectIfAuthenticatedRoute>
        <CommonLayout><Login /></CommonLayout>
      </RedirectIfAuthenticatedRoute>
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
