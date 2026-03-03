import { defineConfig } from "vite";
import { readdirSync } from "fs";

const insightPages = readdirSync(".")
  .filter((f) => f.startsWith("insight-") && f.endsWith(".html"))
  .reduce((acc, f) => {
    acc[f.replace(".html", "")] = f;
    return acc;
  }, {});

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",
        insights: "insights.html",
        location: "location.html",
        ...insightPages,
      },
    },
  },
  server: {
    port: 3010,
    strictPort: true,
    open: false,
  },
});
