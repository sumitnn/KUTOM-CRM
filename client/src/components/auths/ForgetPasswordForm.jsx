import { useState } from "react";
import { toast } from "react-toastify";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="max-w-md w-full p-6 bg-base-100 shadow-xl rounded-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>

        {submitted ? (
          <div className="text-center text-success">
            ✅ A reset link has been sent to your email.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold mb-2">Enter Your Email Address</span>
              </label>
                <input
                  
                type="email"
                placeholder="Enter your email"
                className="input input-bordered w-full font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="pt-4">
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgetPasswordForm;
