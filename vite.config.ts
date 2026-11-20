import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relativ base gjør at bygget virker både på GitHub Pages (/introML/) og lokalt.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
  },
});
