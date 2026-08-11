import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "NEXT_PUBLIC_");
  const isProd = mode === "production";

  return {
    root: __dirname,
    base: "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@electron": path.resolve(__dirname, "../electron-src"),
      },
    },
    // Next/webpack polyfilled `global`; Vite does not. Preload attaches ipcRenderer there.
    define: {
      global: "globalThis",
      ...Object.fromEntries(
        Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
      ),
    },
    css: {
      postcss: path.resolve(__dirname, "postcss.config.js"),
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rolldownOptions: isProd
        ? {
            output: {
              minify: {
                compress: {
                  dropConsole: true,
                },
              },
            },
          }
        : undefined,
    },
    server: {
      port: 3000,
      strictPort: true,
      host: "127.0.0.1",
    },
  };
});
