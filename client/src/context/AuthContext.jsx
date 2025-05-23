
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);


  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser ) {
      setUser(JSON.parse(storedUser));
    }
  }, []);




  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/login/`, { email, password });
      const { user, tokens } = res.data;
  
      setUser(user);
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      localStorage.setItem("user", JSON.stringify(user));
  
      return { success: true,role: user?.role, message: "Login successful" };
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      return {
        success: false,
        role: "unknown",
        message: err.response?.data?.message || "Login failed",
      };
    }
  };



  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    const accessToken = localStorage.getItem("access_token");
  
    try {
      await axios.post(
        `${API_URL}/logout/`,
        { refresh_token: refreshToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, 
          },
        }
      );
    } catch (error) {
      console.error("Logout error:", error.message);
    } finally {
      localStorage.clear();
      setUser(null);
      window.location.href = "/";
    }
  };
  

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout,isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
