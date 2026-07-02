import React from "react";
import ReactDOM from "react-dom/client";

import "./styles/global.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 2500,
          style: {
            borderRadius: "8px",
            background: "#1f2937",
            color: "#fff",
          },
        }}
      />

      <App />
    </AuthProvider>
  </React.StrictMode>,
);
