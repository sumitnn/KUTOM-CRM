// App.jsx
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { VendorProvider } from "./context/VendorContext";




function App() {
  return (
    <AuthProvider>
      <VendorProvider>
      <BrowserRouter>
        <AppRoutes />
        </BrowserRouter>
        </VendorProvider>
    </AuthProvider>
  );
}

export default App;
