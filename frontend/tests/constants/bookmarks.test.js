import { describe, it, expect } from 'vitest';
import { BOOKMARK_STATUS_KEYS, statusLabel, statusEmojiLabel } from '@/constants/bookmarks';

describe('bookmarks constants', () => {
  it('4 статуса в правильном порядке', () => {
    expect(BOOKMARK_STATUS_KEYS).toEqual(['Planned', 'Reading', 'Finished', 'Dropped']);
  });

  it('statusLabel возвращает подпись', () => {
    expect(statusLabel('Reading')).toBe('Читаю');
    expect(statusLabel('Planned')).toBe('В планах');
  });

  it('statusEmojiLabel добавляет эмодзи', () => {
    expect(statusEmojiLabel('Finished')).toBe('✅ Прочитано');
  });

  it('неизвестный ключ → возвращаем сам ключ', () => {
    expect(statusLabel('Unknown')).toBe('Unknown');
    expect(statusEmojiLabel('Unknown')).toBe('Unknown');
  });
});
