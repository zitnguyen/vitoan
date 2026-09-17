import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:9002",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:9002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
