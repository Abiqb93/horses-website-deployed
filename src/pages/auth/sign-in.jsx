import { useState } from "react";
import { Card, Input, Button, Typography } from "@material-tailwind/react";
import { useNavigate, Link } from "react-router-dom";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
  
    const validCredentials = [
      { email: "tom@creativetim.com", password: "Horses_are_running", userId: "Tom" },
      { email: "stuart@blandford.com", password: "Racing_Expert_123", userId: "Stuart" },
    ];
  
    const user = validCredentials.find(
      (u) => u.email === email && u.password === password
    );
  
    if (user) {
      localStorage.setItem("userId", user.userId); // Store userId in localStorage
      navigate("/dashboard/home");
    } else {
      alert("Invalid credentials. Please try again.");
    }
  };
  

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Blandford Analytics Header */}
      <div className="text-center mb-8">
        <Typography variant="h3" className="font-bold text-gray-800 text-2xl">
          Blandford Analytics
        </Typography>
      </div>

      {/* Sign In Form */}
      <Card className="p-6 shadow-lg rounded-lg w-full max-w-md bg-white">
        <Typography variant="h4" className="font-bold text-center mb-4 text-lg">
          Sign In
        </Typography>
        <Typography variant="paragraph" color="blue-gray" className="text-base text-center mb-6">
          Enter your email and password to access your account.
        </Typography>
        <form onSubmit={handleSignIn}>
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
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" fullWidth className="mt-6">
            Sign In
          </Button>
        </form>
        <div className="flex items-center justify-between mt-4">
          <Typography variant="small">
            <a href="#" className="text-blue-500 underline">
              Forgot Password?
            </a>
          </Typography>
        </div>
        <Typography variant="paragraph" className="text-center mt-6 text-blue-gray-500 font-medium">
          Not registered?&nbsp;
          <Link to="/auth/sign-up" className="text-blue-500 underline">
            Create account
          </Link>
        </Typography>
      </Card>
    </section>
  );
}

export default SignIn;
