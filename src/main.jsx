import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import { MaterialTailwindControllerProvider } from "@/context";
import UserContext from "@/context/UserContext";
import "../public/css/tailwind.css";

function RootApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ wait until localStorage is checked

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setUser(storedUser);
    setLoading(false); // ✅ now done loading
  }, []);

  if (loading) return null; // ✅ or a spinner/loading component

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeProvider>
        <MaterialTailwindControllerProvider>
          <App />
        </MaterialTailwindControllerProvider>
      </ThemeProvider>
    </UserContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RootApp />
    </BrowserRouter>
  </React.StrictMode>
);
