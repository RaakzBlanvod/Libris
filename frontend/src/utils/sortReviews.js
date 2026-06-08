// =============================================================================
// Сортировка списка рецензий.
//
// Зачем файл: одинаковый компаратор по «свежести / оценке / лайкам»
// использовался и на странице книги (BookDetailPage), и на странице
// «Лучшие рецензии» (ReviewsPage). Вынесено сюда, чтобы логика была одна.
// =============================================================================

// Допустимые режимы сортировки (используются в <select> на страницах).
export const REVIEW_SORTS = {
  NEW: 'new', // сначала свежие (по дате создания)
  RATING: 'rating', // по средней оценке
  LIKES: 'likes', // по количеству лайков
};

// Возвращает НОВЫЙ отсортированный массив (исходный не мутируется).
export function sortReviews(reviews, mode) {
  const copy = [...reviews];

  if (mode === REVIEW_SORTS.RATING) {
    return copy.sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0));
  }
  if (mode === REVIEW_SORTS.LIKES) {
    return copy.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
  }
  // По умолчанию ('new') — сначала самые свежие.
  return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
