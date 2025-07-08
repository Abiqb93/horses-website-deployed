import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "@/context/UserContext";
import { Card, Button, Typography } from "@material-tailwind/react";

export function ProfilePage() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/auth/sign-in");
  };

  const handleChangePassword = () => {
    navigate("/dashboard/change-password");
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
          User Profile
        </Typography>

        {user ? (
          <div className="space-y-4 text-blue-gray-700 text-sm">
            <div>
              <span className="font-medium">Name:</span> {user.name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">User ID:</span> {user.userId}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={handleChangePassword}
                className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
              >
                Change Password
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <Typography variant="small" className="text-red-600 font-medium text-center">
            You are not logged in.
          </Typography>
        )}
      </Card>
    </section>
  );
}

export default ProfilePage;
