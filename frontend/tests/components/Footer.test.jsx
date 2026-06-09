import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '@/components/Footer/Footer';

// Footer содержит <Link>, поэтому рендерим внутри роутера.
const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

describe('Footer', () => {
  it('«Условия использования» ведут на /terms', () => {
    renderFooter();
    expect(screen.getByText('Условия использования')).toHaveAttribute('href', '/terms');
  });

  it('«API Docs» — внешняя ссылка на Swagger (/docs)', () => {
    renderFooter();
    const link = screen.getByText('API Docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    // Конкретный хост зависит от VITE_API_DOCS_URL (env), поэтому проверяем
    // лишь инвариант: это внешняя ссылка на эндпоинт /docs.
    expect(link.getAttribute('href')).toMatch(/\/docs$/);
  });
});
