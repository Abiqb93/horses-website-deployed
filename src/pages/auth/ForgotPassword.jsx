import { useState } from "react";
import { Card, Button, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ message: "", success: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ message: "", success: false });

    try {
      const response = await fetch("https://horseracesbackend-production.up.railway.app/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (response.ok) {
        setStatus({
          message:
            "A temporary password has been sent to your email. Please change it after login.",
          success: true,
        });
      } else {
        setStatus({ message: result.message || "Failed to reset password.", success: false });
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus({ message: "Something went wrong. Please try again.", success: false });
    }

    setLoading(false);
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="text-center mb-8">
        <Typography variant="h3" className="font-bold text-gray-800 text-2xl">
          Blandford Bloodstock
        </Typography>
      </div>

      <Card className="p-6 shadow-lg rounded-lg w-full max-w-md bg-white">
        <Typography variant="h4" className="font-bold text-center mb-4 text-lg">
          Forgot Password
        </Typography>
        <Typography
          variant="paragraph"
          color="blue-gray"
          className="text-base text-center mb-6"
        >
          Enter your registered email to receive a temporary password.
        </Typography>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" fullWidth disabled={loading} className="mt-2">
            {loading ? "Processing..." : "Send Temporary Password"}
          </Button>
        </form>

        {status.message && (
          <Typography
            variant="small"
            className={`mt-4 text-center ${status.success ? "text-green-600" : "text-red-600"}`}
          >
            {status.message}
          </Typography>
        )}

        <Button
          variant="text"
          fullWidth
          className="mt-6 text-blue-500 underline hover:text-blue-700"
          onClick={() => navigate("/auth/sign-in")}
        >
          Back to Sign In
        </Button>
      </Card>
    </section>
  );
}

export default ForgotPassword;
