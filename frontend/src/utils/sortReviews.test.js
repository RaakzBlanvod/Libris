import { describe, it, expect } from 'vitest';
import { sortReviews } from './sortReviews';

const data = [
  { id: 1, overall_rating: 5, like_count: 2, created_at: '2024-01-01' },
  { id: 2, overall_rating: 9, like_count: 1, created_at: '2024-03-01' },
  { id: 3, overall_rating: 7, like_count: 5, created_at: '2024-02-01' },
];

describe('sortReviews', () => {
  it('по оценке (rating) — по убыванию', () => {
    expect(sortReviews(data, 'rating').map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it('по лайкам (likes) — по убыванию', () => {
    expect(sortReviews(data, 'likes').map((r) => r.id)).toEqual([3, 1, 2]);
  });

  it('по свежести (new) — новые первыми', () => {
    expect(sortReviews(data, 'new').map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it('неизвестный режим = по умолчанию (new)', () => {
    expect(sortReviews(data, 'что-то').map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it('не мутирует исходный массив', () => {
    const before = [...data];
    sortReviews(data, 'likes');
    expect(data).toEqual(before);
  });
});
