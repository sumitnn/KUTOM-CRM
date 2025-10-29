import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../features/auth/authSlice';
import { useLoginMutation } from "../../features/auth/authApi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from "framer-motion";

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

  // Floating background elements animation
  const floatingAnimation = {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, 0],
      rotate: [0, 5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseAnimation = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const rotateAnimation = {
    animate: {
      rotate: [0, 360],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#E5E7EB] relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-20 h-20 bg-indigo-200 rounded-full blur-xl opacity-60"
        variants={floatingAnimation}
        animate="animate"
      />
      <motion.div
        className="absolute top-3/4 right-1/4 w-16 h-16 bg-purple-200 rounded-full blur-xl opacity-50"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: '2s' }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-blue-200 rounded-full blur-xl opacity-40"
        variants={pulseAnimation}
        animate="animate"
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-12 h-12 bg-pink-200 rounded-full blur-lg opacity-60"
        variants={rotateAnimation}
        animate="animate"
      />
      <motion.div
        className="absolute top-1/3 right-1/2 w-28 h-28 bg-teal-200 rounded-full blur-xl opacity-30"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: '4s' }}
      />
      
      {/* Gradient Orbs */}
      <motion.div
        className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-20 blur-2xl"
        variants={pulseAnimation}
        animate="animate"
      />
      <motion.div
        className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-20 blur-2xl"
        variants={pulseAnimation}
        animate="animate"
        style={{ animationDelay: '2s' }}
      />
      
      {/* Animated Grid Pattern */}
      <motion.div
        className="absolute inset-0 opacity-[0.03]"
        variants={rotateAnimation}
        animate="animate"
      >
        <div className="w-full h-full bg-[length:50px_50px] bg-grid-gray-400" />
      </motion.div>

      {/* Login Form Container */}
      <motion.div 
        className="w-full max-w-md p-10 bg-white rounded-xl shadow-xl flex flex-col items-center gap-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold">Welcome Back</h1>
          <p className="text-[#4B5563] text-sm mt-2">Please sign in to your account</p>
        </motion.div>

        <motion.form 
          onSubmit={handleSubmit} 
          className="w-full flex flex-col items-center gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            className="w-full h-12 border border-gray-300 rounded-md px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="on"
            whileFocus={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <motion.input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            className="w-full h-12 border border-gray-300 rounded-md px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
            whileFocus={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
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
            <motion.span 
              className="loading loading-spinner text-info loading-xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <motion.button
              type="submit"
              className="w-full h-12 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Login
            </motion.button>
          )}
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;