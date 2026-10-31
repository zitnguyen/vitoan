import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/nunito/vietnamese-500.css";
import "@fontsource/nunito/latin-500.css";
import "@fontsource/nunito/vietnamese-600.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/vietnamese-700.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/vietnamese-800.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/nunito/vietnamese-900.css";
import "@fontsource/nunito/latin-900.css";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { DialogProvider } from "./context/DialogContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DialogProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </DialogProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
