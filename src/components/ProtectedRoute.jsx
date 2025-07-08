import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import UserContext from "@/context/UserContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(UserContext);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Simulate context initialization check
    const stored = localStorage.getItem("user");
    if (stored && !user) {
      setChecking(true);
      const parsedUser = JSON.parse(stored);
      // Optional: validate token or structure here
      if (parsedUser?.userId) {
        // User is valid, but context is not yet updated. Wait for it.
        setTimeout(() => setChecking(false), 200); // Slight delay
      } else {
        setChecking(false);
      }
    } else {
      setChecking(false);
    }
  }, [user]);

  if (checking) {
    return <div className="text-center mt-10 text-gray-700">Loading...</div>;
  }

  return user ? children : <Navigate to="/auth/sign-in" replace />;
};

export default ProtectedRoute;