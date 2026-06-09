import api from './client';

// =============================================================================
// API книг (/api/v1/books/*). Данные книг приходят из Google Books через бэк.
// Списочные функции всегда возвращают массив (защита от неожиданного ответа).
// =============================================================================

const toArray = (r) => (Array.isArray(r.data) ? r.data : []);

// Детали книги по google_id (им же оперируют URL и страницы).
export const getBook = (googleId) =>
  api.get(`/api/v1/books/${googleId}`).then((r) => r.data);

// Поиск книг (q — запрос, limit ≤ 40 на бэке).
export const searchBooks = (q, limit = 10) =>
  api.get('/api/v1/books/search', { params: { q, limit } }).then(toArray);

// Топ книг недели (кэшируется на бэке).
export const getTrendingBooks = () =>
  api.get('/api/v1/books/trending').then(toArray);
