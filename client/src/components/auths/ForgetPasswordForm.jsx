import { useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ForgetPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forgot-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success(data.detail || "Reset link sent. Please check your email.");
      } else {
        toast.error(data.detail || "Failed to send reset link.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Forgot password error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Background animations
  const floatingAnimation = {
    animate: {
      y: [0, -25, 0],
      x: [0, 15, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseAnimation = {
    animate: {
      scale: [1, 1.15, 1],
      opacity: [0.2, 0.5, 0.2],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const rotateAnimation = {
    animate: {
      rotate: [0, 360],
      transition: {
        duration: 25,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-20 left-10 w-16 h-16 bg-blue-300 rounded-full blur-xl opacity-40"
        variants={floatingAnimation}
        animate="animate"
      />
      <motion.div
        className="absolute bottom-32 right-20 w-20 h-20 bg-purple-300 rounded-full blur-xl opacity-30"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: '2s' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-200 rounded-full blur-2xl opacity-20"
        variants={pulseAnimation}
        animate="animate"
      />
      <motion.div
        className="absolute top-1/3 right-16 w-12 h-12 bg-teal-300 rounded-full blur-lg opacity-50"
        variants={rotateAnimation}
        animate="animate"
      />
      
      {/* Gradient Background Orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-10 blur-3xl"
        variants={pulseAnimation}
        animate="animate"
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl"
        variants={pulseAnimation}
        animate="animate"
        style={{ animationDelay: '3s' }}
      />

      {/* Main Form Container */}
      <motion.div
        className="max-w-md w-full p-8 bg-white shadow-2xl rounded-3xl relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.h2 
              className="text-3xl font-bold text-gray-800 mb-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Forgot Password
            </motion.h2>
            <p className="text-gray-600">Enter your email to reset your password</p>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <motion.div
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-2xl">✅</span>
              </motion.div>
              <p className="text-green-600 font-semibold text-lg">
                Reset link sent successfully!
              </p>
              <p className="text-gray-600 text-sm">
                Check your email for the password reset link
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4"
              >
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                  Back to Login
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-gray-700 mb-2 text-lg">
                    Email Address
                  </span>
                </label>
                <motion.input
                  type="email"
                  placeholder="Enter your email address"
                  className="input input-bordered w-full text-lg py-3 px-4 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  whileFocus={{ 
                    scale: 1.02,
                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
                  }}
                  transition={{ type: "spring", stiffness: 400 }}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  type="submit"
                  className="btn btn-primary w-full text-lg py-3 font-semibold rounded-xl"
                  disabled={loading}
                  whileHover={{ 
                    scale: loading ? 1 : 1.02,
                    boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)"
                  }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {loading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="flex items-center justify-center gap-2"
                    >
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Sending Reset Link...
                    </motion.span>
                  ) : (
                    "Send Reset Link"
                  )}
                </motion.button>
              </motion.div>

              <motion.div variants={itemVariants} className="text-center pt-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                    ← Back to Login
                  </Link>
                </motion.div>
              </motion.div>
            </motion.form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgetPasswordForm;