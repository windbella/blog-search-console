import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const isServer = process.env.BUILD_TARGET === "server";

export default defineConfig(
  isServer
    ? {
        build: {
          target: "node22",
          ssr: true,
          outDir: "dist/server",
          rollupOptions: {
            input: {
              index: resolve(__dirname, "src/server/index.ts"),
            },
          },
        },
      }
    : {
        root: "src/client",
        plugins: [react(), tailwindcss()],
        build: {
          outDir: resolve(__dirname, "dist/client"),
          emptyOutDir: true,
        },
        server: {
          port: 5173,
          host: "0.0.0.0",
          allowedHosts: true,
          proxy: {
            "/api": "http://localhost:3000",
          },
        },
      },
);
