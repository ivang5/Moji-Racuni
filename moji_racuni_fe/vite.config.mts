/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// The app is also opened from other devices on the LAN (http://<ip>:3000),
// so the dev and preview servers listen on all interfaces.
const APP_PORT = 3000;

export default defineConfig(({ mode, isPreview }) => {
  // Empty prefix: also read variables without the VITE_ prefix
  // (e.g. GENERATE_SOURCEMAP). Only VITE_* variables reach the client code.
  const env = loadEnv(mode, process.cwd(), "");

  // The preview server only serves an existing build, so the variable is irrelevant there.
  if (!isPreview && mode !== "test" && !env.VITE_API_BASE_URL) {
    console.warn(
      "VITE_API_BASE_URL nije podešen (vidi .env.example); API zahtevi idu na adresu sa koje je aplikacija učitana.",
    );
  }

  return {
    plugins: [
      react({
        // Components rendered inside the PDF web worker must not get the
        // Fast Refresh runtime, which needs `window`.
        exclude: [
          /\/node_modules\//,
          /\/src\/components\/(RenderPDF|Review)\.tsx$/,
        ],
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: true,
      port: APP_PORT,
      strictPort: true,
    },
    preview: {
      host: true,
      port: APP_PORT,
      strictPort: true,
    },
    build: {
      sourcemap: env.GENERATE_SOURCEMAP === "true",
    },
    optimizeDeps: {
      // Only imported from the PDF worker, which the dependency scanner does
      // not follow; without this the first visit to /statistika triggers a
      // re-optimization and a full page reload in dev.
      include: ["@react-pdf/renderer"],
    },
    worker: {
      // The PDF worker is a module worker and lazy-loads the renderer,
      // which needs code splitting (not supported by the iife format).
      format: "es",
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["import"],
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
