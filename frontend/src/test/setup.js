// Глобальная настройка тестовой среды (подключается через test.setupFiles).
// Добавляет матчеры @testing-library/jest-dom (toBeInTheDocument, toHaveAttribute и т.п.)
// и автоматически чистит DOM между тестами.
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
