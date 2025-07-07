import { useContext } from "react";
import UserContext from "@/context/UserContext";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/auth/sign-in");
  };

  return (
    <div className="p-6 max-w-xl mx-auto mt-10 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-blue-gray-800">User Profile</h1>

      {user ? (
        <div className="space-y-4 text-blue-gray-700">
          <div>
            <span className="font-medium">Name:</span> {user.name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">User ID:</span> {user.userId}
          </div>

          {/* Future optional fields */}
          {/* <div>
            <span className="font-medium">Joined:</span> {user.joinedDate || 'N/A'}
          </div> */}

          <button
            onClick={handleLogout}
            className="mt-6 px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      ) : (
        <p className="text-red-600 font-medium">You are not logged in.</p>
      )}
    </div>
  );
}

export default ProfilePage;
