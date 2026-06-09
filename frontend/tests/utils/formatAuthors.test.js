import { describe, it, expect } from 'vitest';
import { formatAuthors } from '@/utils/formatAuthors';

describe('formatAuthors', () => {
  it('массив объектов { name } → строка через запятую', () => {
    expect(formatAuthors({ authors: [{ name: 'Толстой' }, { name: 'Чехов' }] })).toBe('Толстой, Чехов');
  });

  it('массив строк', () => {
    expect(formatAuthors({ authors: ['Толстой', 'Чехов'] })).toBe('Толстой, Чехов');
  });

  it('берёт альтернативное поле имени (full_name)', () => {
    expect(formatAuthors({ authors: [{ full_name: 'Кто-то' }] })).toBe('Кто-то');
  });

  it('authors как одна строка', () => {
    expect(formatAuthors({ authors: 'Один Автор' })).toBe('Один Автор');
  });

  it('пустой массив → фолбэк', () => {
    expect(formatAuthors({ authors: [] })).toBe('Автор не указан');
  });

  it('нет authors → фолбэк', () => {
    expect(formatAuthors({})).toBe('Автор не указан');
  });

  it('book = null с кастомным фолбэком', () => {
    expect(formatAuthors(null, '—')).toBe('—');
  });
});
