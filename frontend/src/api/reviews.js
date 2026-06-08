import api from './client';

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
