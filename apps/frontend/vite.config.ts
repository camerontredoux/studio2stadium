import path from "path";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

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
    tailwindcss(),
    process.env.ANALYZE
      ? visualizer({
          open: true,
          gzipSize: true,
          filename: "stats.html",
        })
      : null,
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
