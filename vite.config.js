import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",
        insights: "insights.html",
        location: "location.html",
        "insight-gabsangsoggongje": "insight-gabsangsoggongje.html",
      },
    },
  },
  server: {
    port: 3010,
    strictPort: true,
    open: false,
  },
});
