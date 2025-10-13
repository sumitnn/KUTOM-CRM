import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { ToastContainer } from 'react-toastify';
import useAutoRefreshToken from "./hooks/useAutoRefreshToken"
import { Suspense } from 'react';
import Spinner from  '@/components/common/Spinner'; 

function App() {
  useAutoRefreshToken();
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastContainer 
        position="bottom-right"   
        autoClose={3000}          
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
      />
      <Suspense fallback={<Spinner />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;