import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The dev server forwards /api calls to the Express server, so no CORS or hard-coded URLs.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
