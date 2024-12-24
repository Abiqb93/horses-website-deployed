import { useState } from "react";
import { Card, Input, Checkbox, Button, Typography } from "@material-tailwind/react";
import { useNavigate, Link } from "react-router-dom";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
    if (email === "tom@creativetim.com" && password === "Horses_are_running") {
      navigate("/dashboard/home");
    } else {
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Blandford Analysis Header */}
      <div className="text-center mb-8">
        <Typography variant="h1" className="font-bold text-gray-800 text-4xl">
          Blandford Analysis
        </Typography>
        <Typography variant="paragraph" color="blue-gray" className="text-lg font-medium mt-2">
          Empowering Insights for Horse Racing Analytics
        </Typography>
      </div>

      {/* Sign In Form */}
      <Card className="p-6 shadow-lg rounded-lg w-full max-w-md bg-white">
        <Typography variant="h2" className="font-bold text-center mb-4">
          Sign In
        </Typography>
        <Typography variant="paragraph" color="blue-gray" className="text-lg text-center mb-6">
          Enter your email and password to access your account.
        </Typography>
        <form onSubmit={handleSignIn}>
          <div className="mb-6">
            <Input
              size="lg"
              placeholder="name@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Your Email"
            />
          </div>
          <div className="mb-6">
            <Input
              type="password"
              size="lg"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
            />
          </div>
          <Checkbox
            label={
              <Typography variant="small" color="gray" className="font-medium">
                I agree to the&nbsp;
                <a href="#" className="text-blue-500 underline">
                  Terms and Conditions
                </a>
              </Typography>
            }
          />
          <Button type="submit" fullWidth className="mt-6">
            Sign In
          </Button>
        </form>
        <div className="flex items-center justify-between mt-4">
          <Checkbox
            label={
              <Typography variant="small" color="gray" className="font-medium">
                Subscribe me to newsletter
              </Typography>
            }
          />
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
