// App.jsx
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from 'react-toastify';




function App() {
  return (
    <AuthProvider>
      
      <BrowserRouter>
      <ToastContainer 
        position="bottom-right"   
        autoClose={3000}          
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
      
        pauseOnHover
      />
        <AppRoutes />
        </BrowserRouter>
      
    </AuthProvider>
  );
}

export default App;
