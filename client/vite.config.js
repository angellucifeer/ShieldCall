import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Forces the compiler to skip hanging processes by using standard esbuild minification
    minify: 'esbuild',
    cssMinify: true,
    // Prevents bundling pipelines from freezing on warnings or infinite file loops
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
  }
})