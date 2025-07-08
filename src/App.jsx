import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* 🔐 Protect dashboard route */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* 🆓 Public routes like sign in / sign up */}
      <Route path="/auth/*" element={<Auth />} />

      {/* 🚨 Catch-all: if route doesn't match, go to sign-in */}
      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}

export default App;
