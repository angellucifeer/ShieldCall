import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Splitting large realtime modules prevents the compiler worker threads from locking up
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase') || id.includes('react-router-dom')) {
              return 'vendor-core';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})