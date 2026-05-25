import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Capacitor's native webview loads assets from the filesystem, so paths
  // must be relative (./). This does NOT break the browser dev server.
  base: "./",
  build: {
    // Ensure sourcemaps are available for debugging in native IDEs
    sourcemap: true,
  },
})
