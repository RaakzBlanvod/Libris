import { fileURLToPath, URL } from 'node:url'
// defineConfig берём из 'vitest/config' — это тот же конфиг Vite, но с типами
// для блока test (Vitest). На прод-сборку (vite build) блок test не влияет.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Алиас "@" → папка src. Позволяет писать "@/api/books" вместо "../../api/books".
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
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
  },
  // Конфиг тестов (Vitest):
  //  - environment: jsdom — эмулируем DOM для компонентных тестов;
  //  - globals: true — describe/it/expect доступны без импорта (мы всё равно
  //    импортируем их явно в тестах, чтобы не спорить с ESLint);
  //  - setupFiles — подключает матчеры @testing-library/jest-dom;
  //  - include — тесты лежат вне src, в отдельной папке tests/;
  //  - css: false — не обрабатываем CSS в тестах (быстрее, Tailwind тут не нужен).
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    css: false,
  },
})
