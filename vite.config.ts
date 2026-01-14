import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller bundle
    target: "esnext",
    // Enable minification
    minify: "esbuild",
    // Generate source maps only in development
    sourcemap: mode === "development",
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Core React runtime - smallest, loads first
          "react-vendor": ["react", "react-dom"],
          // Router - needed for navigation
          "router": ["react-router-dom"],
          // UI framework chunks
          "radix-core": [
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-dialog",
            "@radix-ui/react-popover",
          ],
          "radix-form": [
            "@radix-ui/react-label",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-select",
            "@radix-ui/react-switch",
          ],
          "radix-layout": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-tabs",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
          ],
          "radix-overlay": [
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-hover-card",
          ],
          "radix-feedback": [
            "@radix-ui/react-toast",
            "@radix-ui/react-progress",
            "@radix-ui/react-avatar",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-slider",
          ],
          // Animation library - lazy loaded with pages that use it
          "animation": ["framer-motion"],
          // Charts - only loaded on pages with charts
          "charts": ["recharts"],
          // Data fetching
          "data": ["@tanstack/react-query", "@supabase/supabase-js"],
          // Utilities
          "utils": ["clsx", "tailwind-merge", "class-variance-authority", "date-fns", "zod"],
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
    ],
    // Exclude heavy dependencies from pre-bundling to allow code splitting
    exclude: ["framer-motion", "recharts"],
  },
}));
