import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: [{ find: "@", replacement: "/src" }],
//   },
//   base: '/horses-website-deployed/', // Add this line to set the correct base path for GitHub Pages
// });


export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  base: "/", // Ensure the root path is set
  server: {
    port: 8080, // Local development port
    proxy: {
      '/api': {
        target: 'https://horseracesbackend-production.up.railway.app/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});