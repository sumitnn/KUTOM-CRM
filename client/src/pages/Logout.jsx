
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLogoutMutation } from "../features/auth/authApi";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../features/auth/authSlice";

const Logout = () => {
  const [triggerLogout] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      const refresh_token = localStorage.getItem("refresh_token");

      try {
        if (refresh_token) {
          await triggerLogout(refresh_token).unwrap();
        }
      } catch (error) {
        console.error("Logout API failed:", error);
      } finally {
        dispatch(logoutAction()); 
        navigate("/login", { replace: true });
      }
    };

    performLogout();
  }, [dispatch, navigate, triggerLogout]);

  return null; // or a loading spinner if you like
};

export default Logout;
