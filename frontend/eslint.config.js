import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Намеренно держим хук useAuth рядом с AuthProvider и хелперы рядом с Avatar —
      // дробить файлы ради hot-reload не хотим.
      'react-refresh/only-export-components': 'off',
      // Стандартный паттерн «загрузка данных в useEffect + setLoading» нас устраивает.
      'react-hooks/set-state-in-effect': 'off',
      // Функции-загрузчики намеренно не в списке зависимостей эффектов.
      'react-hooks/exhaustive-deps': 'off',
    },
  },
])
