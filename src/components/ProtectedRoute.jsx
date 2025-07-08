import { useContext } from "react";
import { Navigate } from "react-router-dom";
import UserContext from "@/context/UserContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(UserContext);

  // Show loading state until user context is initialized
  if (user === null && localStorage.getItem("user")) {
    return <div className="text-center mt-10 text-gray-700">Loading...</div>;
  }

  return user ? children : <Navigate to="/auth/sign-in" replace />;
};

export default ProtectedRoute;
