import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";

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
          body: JSON.stringify({ new_password:newPassword,userid,token }),
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="max-w-md w-full p-6 bg-base-100 shadow-xl rounded-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>

        {submitted ? (
          <div className="text-center text-success space-y-4">
            ✅ Your password has been reset successfully.
            <br />
            <Link to="/" className="text-primary underline font-semibold">
              Go to Home Page
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label font-bold">New Password</label>
                              <input
                                  id="password"
                type="password"
                className="input input-bordered w-full"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-control">
              <label className="label font-bold">Confirm Password</label>
                              <input
                                  id="confirmpassword"
                type="password"
                className="input input-bordered w-full"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
