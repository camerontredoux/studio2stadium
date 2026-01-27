import path from "path";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { analyzer } from "vite-bundle-analyzer";

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "@tanstack/react-router-devtools",
      "@tanstack/react-query-devtools",
      "zod",
      "react-hook-form",
    ],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
    warmup: {
      clientFiles: [
        "./src/main.tsx",
        "./src/routes/__root.tsx",
        "./src/routeTree.gen.ts",
      ],
    },
  },
  plugins: [
    devtools(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    tailwindcss({
      optimize: {
        minify: true,
      },
    }),
    analyzer({ summary: true, enabled: process.env.ANALYZE !== undefined }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom)\//.test(id)) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack/react-router")) {
            return "vendor-router";
          }
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "vendor-query";
          }
          // if (id.includes("node_modules/@base-ui/react")) {
          //   return "vendor-ui";
          // }
          if (id.includes("node_modules/zod")) {
            return "vendor-zod";
          }
          if (id.includes("node_modules/react-hook-form")) {
            return "vendor-form";
          }
        },
      },
    },
  },
});
