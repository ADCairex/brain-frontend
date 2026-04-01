import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@finance": path.resolve(__dirname, "./src/modules/finance"),
      "@calendar": path.resolve(__dirname, "./src/modules/calendar"),
      "@auth": path.resolve(__dirname, "./src/modules/auth"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@shell": path.resolve(__dirname, "./src/shell"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["src/modules/**", "src/shell/**", "src/shared/context/**"],
      exclude: ["src/shared/components/ui/**"],
    },
  },
});
