import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // All REST API routes → FastAPI (no prefix stripping needed now)
      '/eval':         { target: 'http://localhost:8000', changeOrigin: true },
      '/improve':      { target: 'http://localhost:8000', changeOrigin: true },
      '/stats':        { target: 'http://localhost:8000', changeOrigin: true },
      '/regression':   { target: 'http://localhost:8000', changeOrigin: true },
      '/proxy':        { target: 'http://localhost:8000', changeOrigin: true },
      '/health':       { target: 'http://localhost:8000', changeOrigin: true },
      '/monitor':      { target: 'http://localhost:8000', changeOrigin: true },
      '/security':     { target: 'http://localhost:8000', changeOrigin: true },
      // WebSocket proxy
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
