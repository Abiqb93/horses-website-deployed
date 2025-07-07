import {
  Input,
  Button,
  Typography,
  IconButton,
} from "@material-tailwind/react";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    userID: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    captcha: "",
  });

  const [captchaText, setCaptchaText] = useState("");
  const canvasRef = useRef(null);

  function generateCaptcha() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let text = "";
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
  }

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    drawCaptcha();
  }, [captchaText]);

  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 100, 40);
    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(0, 0, 100, 40);

    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#333";
    ctx.setTransform(1, 0.1, 0.1, 1, 0, 0);

    for (let i = 0; i < captchaText.length; i++) {
      const x = 10 + i * 16;
      const y = 25 + Math.random() * 5;
      ctx.fillText(captchaText[i], x, y);
    }

    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 100, Math.random() * 40);
      ctx.lineTo(Math.random() * 100, Math.random() * 40);
      ctx.strokeStyle = "#aaa";
      ctx.stroke();
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (formData.captcha.toUpperCase() !== captchaText) {
      alert("Captcha is incorrect.");
      generateCaptcha();
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Registration successful!");
      } else {
        alert(result.message || "Registration failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting form.");
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-2">
      <Typography variant="h6" className="mb-2 font-bold text-blue-gray-900 text-center">
        Blandford Bloodstock
      </Typography>

      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-4">
        <Typography variant="h6" className="mb-3 text-center font-semibold">
          Sign Up
        </Typography>

        <form onSubmit={handleSubmit} className="space-y-2">
          {[ 
            { name: "name", label: "Full Name" },
            { name: "userID", label: "User ID" },
            { name: "email", label: "Email", type: "email" },
            { name: "mobile", label: "Mobile Number" },
            { name: "password", label: "Password", type: "password" },
            { name: "confirmPassword", label: "Confirm Password", type: "password" },
          ].map(({ name, label, type = "text" }) => (
            <div key={name}>
              <label className="text-xs font-medium text-gray-700 block mb-0.5">{label}</label>
              <Input
                name={name}
                type={type}
                size="sm"
                onChange={handleChange}
                className="!py-1 text-sm"
                required={name !== "mobile"}
              />
            </div>
          ))}

          <div className="flex items-center gap-2 mt-1">
            <canvas ref={canvasRef} width={100} height={40} className="border rounded bg-white" />
            <IconButton
              onClick={generateCaptcha}
              variant="outlined"
              size="sm"
              className="rounded-full border-gray-400"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </IconButton>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-0.5">Enter Captcha</label>
            <Input
              name="captcha"
              size="sm"
              onChange={handleChange}
              className="!py-1 text-sm"
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" size="sm">
            Register
          </Button>

          <Typography variant="small" className="text-center text-gray-600 text-xs mt-2">
            Already have an account?
            <Link to="/auth/sign-in" className="text-blue-700 ml-1 underline">Sign in</Link>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignUp;
