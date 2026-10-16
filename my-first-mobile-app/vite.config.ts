import { defineConfig } from "vite";

export default defineConfig({
  root: "./src",
  build: {
    outDir: "./dist",
    minify: true,
    emptyOutDir: true,
  },
  server: {
    allowedHosts: ["5a24-186-84-89-89.ngrok-free.app"],
  },
});
