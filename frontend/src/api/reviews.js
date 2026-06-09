import api from './client';

// =============================================================================
// API рецензий (/api/v1/reviews/*) + хелперы для «докрашивания» лайков.
// Списочные функции всегда возвращают массив.
// =============================================================================

const toArray = (r) => (Array.isArray(r.data) ? r.data : []);

// Топ рецензий недели (кэш Redis). В ответе есть book с google_id.
export const getTrendingReviews = () =>
  api.get('/api/v1/reviews/trending').then(toArray);

// Рецензии текущего пользователя (с вложенной book).
export const getMyReviews = () =>
  api.get('/api/v1/reviews/my').then(toArray);

// Все рецензии конкретной книги (по внутреннему id книги).
export const getBookReviews = (bookId) =>
  api.get(`/api/v1/reviews/book/${bookId}`).then(toArray);

// Создать рецензию на книгу (по внутреннему id книги).
export const createReview = (bookId, data) =>
  api.post(`/api/v1/reviews/book/${bookId}`, data).then((r) => r.data);

// Обновить свою рецензию.
export const updateReview = (id, data) =>
  api.patch(`/api/v1/reviews/${id}`, data).then((r) => r.data);

// Удалить свою рецензию.
export const removeReview = (id) => api.delete(`/api/v1/reviews/${id}`);

// Переключить лайк рецензии. Возвращает { is_liked }.
export const toggleLike = (id) =>
  api.post(`/api/v1/reviews/${id}/like`).then((r) => r.data);

// Тренды рецензий отдаются из кэша Redis, где is_liked всегда false.
// Эти хелперы позволяют «докрасить» сердечки поверх кэша по списку
// лайкнутых ID текущего пользователя.

// Возвращает массив ID рецензий, которые лайкнул пользователь.
// Для гостя или при ошибке — пустой массив (сердечки останутся пустыми).
export const getLikedReviewIds = async (user) => {
  if (!user) return [];
  try {
    const res = await api.get('/api/v1/reviews/my/likes');
    // Подстраховка: если вдруг пришёл не массив — отдаём пустой.
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

// Проставляет is_liked в списке рецензий по набору лайкнутых ID.
// Защищаемся от не-массивов на входе (чтобы не уронить рендер).
export const dockLikes = (reviews, likedIds) => {
  if (!Array.isArray(reviews)) return [];
  const ids = Array.isArray(likedIds) ? likedIds : [];
  const likedSet = likedIds instanceof Set ? likedIds : new Set(ids);
  return reviews.map((review) => ({
    ...review,
    is_liked: likedSet.has(review.id),
  }));
};
