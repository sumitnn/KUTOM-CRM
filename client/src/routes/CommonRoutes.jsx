import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import CommonLayout from "../layout/CommonLayout";
import RedirectIfAuthenticatedRoute from "../routes/RedirectIfAuthenticatedRoute";
import PageNotFound from "../PageNotFound";

// Lazy load components
const Login = lazy(() => import("../components/auths/Login"));
const ResetPassword = lazy(() => import("../components/auths/ResetPassword"));
const ForgetPasswordForm = lazy(() => import("../components/auths/ForgetPasswordForm"));
const HomePage = lazy(() => import("../components/common/HomePage"));
const BusinessPage = lazy(() => import("../components/common/BusinessPage"));
const ContactUsPage = lazy(() => import("../components/common/ContactUsPage"));

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Wrapper component for suspense
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

const commonRoutes = [
  <Route
    key="home"
    path="/"
    element={
      <RedirectIfAuthenticatedRoute>
      <CommonLayout>
        <SuspenseWrapper>
          <HomePage />
        </SuspenseWrapper>
      </CommonLayout></RedirectIfAuthenticatedRoute>
    }
  />,
  <Route
    key="business"
    path="/business"
    element={
      <RedirectIfAuthenticatedRoute>
      <CommonLayout>
        <SuspenseWrapper>
          <BusinessPage />
        </SuspenseWrapper>
      </CommonLayout></RedirectIfAuthenticatedRoute>
    }
  />,
  <Route
    key="contact-us"
    path="/contact-us"
    element={
       <RedirectIfAuthenticatedRoute>
      <CommonLayout>
        <SuspenseWrapper>
          <ContactUsPage />
        </SuspenseWrapper>
      </CommonLayout></RedirectIfAuthenticatedRoute>
    }
  />,
  <Route
    key="login"
    path="/login"
    element={
      <RedirectIfAuthenticatedRoute>
        <CommonLayout>
          <SuspenseWrapper>
            <Login />
          </SuspenseWrapper>
        </CommonLayout>
      </RedirectIfAuthenticatedRoute>
    }
  />,
  <Route
    key="forget-password"
    path="/forget-password"
    element={
      <CommonLayout>
        <SuspenseWrapper>
          <ForgetPasswordForm />
        </SuspenseWrapper>
      </CommonLayout>
    }
  />,
  <Route
    key="reset-password"
    path="/reset-password/:userid/:token"
    element={
      <CommonLayout>
        <SuspenseWrapper>
          <ResetPassword />
        </SuspenseWrapper>
      </CommonLayout>
    }
  />,
  <Route
    key="not-found"
    path="*"
    element={<PageNotFound />}
  />,
];

export default commonRoutes;