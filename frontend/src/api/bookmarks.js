import api from './client';

// =============================================================================
// API закладок/библиотеки (/api/v1/bookmarks/*).
// Список всегда возвращается массивом (если прокси вдруг вернёт не JSON —
// получим [], а не упадём на .map/.filter в компонентах).
// =============================================================================

// Список закладок пользователя; опционально фильтр по статусу.
// В каждой закладке бэк уже отдаёт вложенный объект book.
export const getBookmarks = (status) =>
  api
    .get('/api/v1/bookmarks/', { params: status ? { status } : {} })
    .then((r) => (Array.isArray(r.data) ? r.data : []));

// Добавить книгу в библиотеку или сменить её статус (upsert на одном эндпоинте).
export const setBookmark = (bookId, status) =>
  api.post('/api/v1/bookmarks/', { book_id: bookId, status }).then((r) => r.data);

// Удалить закладку (по внутреннему id книги).
export const removeBookmark = (bookId) =>
  api.delete(`/api/v1/bookmarks/${bookId}`);
