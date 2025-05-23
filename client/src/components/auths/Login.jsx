import React, { useState ,useEffect} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const { login,user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isloading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "vendor":
          navigate("/vendor/dashboard");
          break;
        case "stockist":
          navigate("/stockist/dashboard");
          break;
        default:
          break;
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login(email, password);
      setIsLoading(false);
      if (res.success) {
        switch (res.role) {
          case "admin":
            navigate("/admin/dashboard");
            break;
          case "vendor":
            navigate("/vendor/dashboard");
            break;
          case "stockist":
            navigate("/stockist/dashboard");
            break;
          default:
            break;
        }
      } else {
        setErrorMsg(res.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setErrorMsg("Something went wrong. Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#E5E7EB]">
      <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-xl flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold">Welcome Back</h1>
          <p className="text-[#4B5563] text-sm mt-2">Please sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full h-12 border border-gray-300 rounded-md px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full h-12 border border-gray-300 rounded-md px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-between items-center w-full text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              Remember me
            </label>
            <Link to="/forget-password" className="text-indigo-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
          
          {isloading ? (
  <span className="loading loading-spinner text-info loading-xl"></span>
) : (
  <button
    type="submit"
    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
  >
    Login
  </button>
)}

          
        </form>
      </div>
    </div>
  );
};

export default Login;
