import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'window.global': {}
  },
  resolve: {
    alias: {
      './runtimeConfig': './runtimeConfig.browser',
    },
    extensions: [".jsx", ".js"],
  },
});
