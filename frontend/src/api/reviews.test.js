import { describe, it, expect } from 'vitest';
import { dockLikes } from './reviews';

describe('dockLikes', () => {
  const reviews = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('проставляет is_liked по массиву ID', () => {
    const res = dockLikes(reviews, [2]);
    expect(res.map((r) => r.is_liked)).toEqual([false, true, false]);
  });

  it('принимает Set лайкнутых ID', () => {
    const res = dockLikes(reviews, new Set([1, 3]));
    expect(res.map((r) => r.is_liked)).toEqual([true, false, true]);
  });

  it('не-массив reviews → пустой массив', () => {
    expect(dockLikes(null, [1])).toEqual([]);
    expect(dockLikes('<!doctype html>', [1])).toEqual([]);
  });

  it('не-массив likedIds → ничего не лайкнуто', () => {
    const res = dockLikes(reviews, undefined);
    expect(res.every((r) => r.is_liked === false)).toBe(true);
  });

  it('не мутирует исходные объекты', () => {
    dockLikes(reviews, [1]);
    expect(reviews[0].is_liked).toBeUndefined();
  });
});
