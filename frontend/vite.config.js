import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // Бэкенд отдаёт аватары по относительному пути /static/avatars/...
      // Без этого прокси картинки уходят на Vite (5173) и возвращают 404.
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      }
    }
  }
})