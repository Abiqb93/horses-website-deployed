import { Input, Button, Typography } from "@material-tailwind/react";
import { useState } from "react";

function ChangePassword() {
  const [formData, setFormData] = useState({
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, oldPassword, newPassword, confirmNewPassword } = formData;

    if (!email || !oldPassword || !newPassword || !confirmNewPassword) {
      alert("All fields are required.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://horseracesbackend-production.up.railway.app/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, oldPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Password changed successfully.");
        setFormData({
          email: "",
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        alert(data.message || "Failed to change password.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while changing the password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-4">
        <Typography variant="h6" className="mb-4 text-center font-semibold">
          Change Password
        </Typography>

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { name: "email", label: "Email", type: "email" },
            { name: "oldPassword", label: "Current Password", type: "password" },
            { name: "newPassword", label: "New Password", type: "password" },
            { name: "confirmNewPassword", label: "Confirm New Password", type: "password" },
          ].map(({ name, label, type }) => (
            <div key={name}>
              <label className="text-xs font-medium text-gray-700 block mb-0.5">{label}</label>
              <Input
                name={name}
                type={type}
                size="sm"
                onChange={handleChange}
                value={formData[name]}
                required
                className="!py-1 text-sm"
              />
            </div>
          ))}

          <Button type="submit" className="w-full mt-2" size="sm" disabled={loading}>
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </div>
    </section>
  );
}

export default ChangePassword;
