import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
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

// Router dạng "dữ liệu" (createBrowserRouter) để dùng được useBlocker — chặn nút Lùi khi đang làm bài kiểm tra.
// Toàn bộ tuyến đường vẫn khai báo trong <Routes> của App như cũ (route "*" bọc ngoài).
const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <ToastProvider>
        <DialogProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </DialogProvider>
      </ToastProvider>
    ),
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
