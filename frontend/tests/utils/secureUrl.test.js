import { describe, it, expect } from 'vitest';
import { secureUrl } from '@/utils/secureUrl';

describe('secureUrl', () => {
  it('http → https', () => {
    expect(secureUrl('http://books.google.com/x')).toBe('https://books.google.com/x');
  });

  it('https не меняется', () => {
    expect(secureUrl('https://a.com/x')).toBe('https://a.com/x');
  });

  it('пусто / undefined / null → пустая строка', () => {
    expect(secureUrl('')).toBe('');
    expect(secureUrl(undefined)).toBe('');
    expect(secureUrl(null)).toBe('');
  });

  it('относительный путь не трогаем', () => {
    expect(secureUrl('/static/avatars/x.png')).toBe('/static/avatars/x.png');
  });
});
