// App.jsx
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";

import { ToastContainer } from 'react-toastify';


function App() {
  return (
    
      
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
   
  );
}

export default App;
