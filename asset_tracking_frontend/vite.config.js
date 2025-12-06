import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REMOVED: The 'css: { transformer: 'lightningcss' }' block has been removed.
  // This ensures Vite uses the stable PostCSS pipeline (via postcss.config.js)
  // which is required for the V3 style @tailwind directives in index.css.
})