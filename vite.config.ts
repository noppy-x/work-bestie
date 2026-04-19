import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, readFileSync, writeFileSync, existsSync } from "fs";

// Plugin to copy HTML files to dist root and fix asset paths
function chromeExtensionPlugin() {
  return {
    name: "chrome-extension-html",
    closeBundle() {
      // Copy and fix popup.html
      const popupSrc = resolve(__dirname, "dist/src/popup/popup.html");
      const popupDest = resolve(__dirname, "dist/popup.html");
      if (existsSync(popupSrc)) {
        let html = readFileSync(popupSrc, "utf-8");
        // Fix paths: remove leading / since Chrome extension uses relative paths
        html = html.replace(/src="\//g, 'src="./');
        html = html.replace(/href="\//g, 'href="./');
        writeFileSync(popupDest, html);
      }
      // Copy and fix offscreen.html
      const offscreenSrc = resolve(__dirname, "dist/src/offscreen/offscreen.html");
      const offscreenDest = resolve(__dirname, "dist/offscreen.html");
      if (existsSync(offscreenSrc)) {
        let html = readFileSync(offscreenSrc, "utf-8");
        html = html.replace(/src="\//g, 'src="./');
        html = html.replace(/href="\//g, 'href="./');
        writeFileSync(offscreenDest, html);
      }
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  plugins: [chromeExtensionPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        offscreen: resolve(__dirname, "src/offscreen/offscreen.html"),
        popup: resolve(__dirname, "src/popup/popup.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
