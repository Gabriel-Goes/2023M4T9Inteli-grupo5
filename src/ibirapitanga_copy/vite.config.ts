import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true
      },
      "/nrt": {
        target: "ws://127.0.0.1:8788",
        ws: true,
        changeOrigin: true
      }
    }
  }
});
