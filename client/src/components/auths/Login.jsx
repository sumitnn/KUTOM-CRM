import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../features/auth/authSlice';
import { useLoginMutation } from "../../features/auth/authApi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // This is the RTK Query mutation hook for login
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
  
      if (res.tokens && res.tokens.access) {
        localStorage.setItem('access_token', res.tokens.access);
        localStorage.setItem('refresh_token', res.tokens.refresh);
  
        dispatch(loginSuccess({ role: res.user.role, ...res.user }));
  
        switch (res.user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'vendor':
            navigate('/vendor/dashboard');
            break;
          case 'stockist':
            navigate('/stockist/dashboard');
            break;
          case 'reseller':
              navigate('/reseller/dashboard');
              break;
          default:
            navigate('/');
        }
      } else {
        toast.error(res.message || 'Invalid credentials');
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Login failed')
      
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
            id="email"
            name="email"
            placeholder="Email"
            className="w-full h-12 border border-gray-300 rounded-md px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="on"
          />
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            className="w-full h-12 border border-gray-300 rounded-md px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
          />

          <div className="flex justify-between items-center w-full text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="checkbox" id="checkbox" className="w-4 h-4 cursor-pointer" />
              Remember me
            </label>
            <Link to="/forget-password" className="text-indigo-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

         

          {isLoading ? (
            <span className="loading loading-spinner text-info loading-xl"></span>
          ) : (
            <button
              type="submit"
              className="w-full h-12 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold"
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
