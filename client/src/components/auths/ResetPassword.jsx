import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const { userid, token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters long.");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/reset-password/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ new_password: newPassword, userid, token }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success(data.detail || "Password reset successfully.");
      } else {
        toast.error(data.detail || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Background animations
  const floatingAnimation = {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, 0],
      transition: {
        duration: 7,
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
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-24 right-16 w-14 h-14 bg-green-300 rounded-full blur-xl opacity-40"
        variants={floatingAnimation}
        animate="animate"
      />
      <motion.div
        className="absolute bottom-28 left-20 w-18 h-18 bg-emerald-300 rounded-full blur-xl opacity-30"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: '1.5s' }}
      />
      <motion.div
        className="absolute top-1/3 left-1/3 w-20 h-20 bg-teal-200 rounded-full blur-2xl opacity-25"
        variants={pulseAnimation}
        animate="animate"
      />
      
      {/* Gradient Background Orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-10 blur-3xl"
        variants={pulseAnimation}
        animate="animate"
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full opacity-10 blur-3xl"
        variants={pulseAnimation}
        animate="animate"
        style={{ animationDelay: '2s' }}
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
              Reset Password
            </motion.h2>
            <p className="text-gray-600">Create your new password</p>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <motion.div
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 0.8 }}
              >
                <span className="text-3xl">🎉</span>
              </motion.div>
              <div>
                <p className="text-green-600 font-semibold text-xl mb-2">
                  Password Reset Successfully!
                </p>
                <p className="text-gray-600">
                  Your password has been updated successfully.
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pt-4"
              >
                <Link 
                  to="/login" 
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Go to Login
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
                    New Password
                  </span>
                </label>
                <motion.input
                  id="password"
                  type="password"
                  className="input input-bordered w-full text-lg py-3 px-4 border-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  whileFocus={{ 
                    scale: 1.02,
                    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)"
                  }}
                  transition={{ type: "spring", stiffness: 400 }}
                />
                <div className="label">
                  <span className="label-text-alt text-gray-500">
                    Must be at least 8 characters long
                  </span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-gray-700 mb-2 text-lg">
                    Confirm Password
                  </span>
                </label>
                <motion.input
                  id="confirmpassword"
                  type="password"
                  className="input input-bordered w-full text-lg py-3 px-4 border-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  whileFocus={{ 
                    scale: 1.02,
                    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)"
                  }}
                  transition={{ type: "spring", stiffness: 400 }}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  type="submit"
                  className="btn btn-success w-full text-lg py-3 font-semibold rounded-xl"
                  disabled={loading}
                  whileHover={{ 
                    scale: loading ? 1 : 1.02,
                    boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
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
                      Resetting Password...
                    </motion.span>
                  ) : (
                    "Reset Password"
                  )}
                </motion.button>
              </motion.div>
            </motion.form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;