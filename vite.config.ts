import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
export default defineConfig({
  plugins: [react(), UnoCSS()],
  build: { outDir: "dist", manifest: true },
  server: { host: true, open: true },
});
