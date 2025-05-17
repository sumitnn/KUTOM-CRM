import { useState } from "react";

const ForgetPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // You can call your API here to send the reset email
    console.log("Reset link sent to:", email);
    setSubmitted(true);
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
                <span className="label-text">Email Address</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="pt-4">
              <button type="submit" className="btn btn-primary w-full">
                Send Reset Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgetPasswordForm;
