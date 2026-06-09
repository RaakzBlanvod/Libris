import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookmarks, setBookmark, removeBookmark } from '@/api/bookmarks';
import { useToast } from '@/context/ToastContext';
import {
  BOOKMARK_STATUS_KEYS,
  BOOKMARK_STATUS_MAP,
  statusEmojiLabel,
} from '@/constants/bookmarks';
import { formatAuthors } from '@/utils/formatAuthors';
import { secureUrl } from '@/utils/secureUrl';

// =============================================================================
// Вкладка «Профиль → Закладки» — список закладок выбранного статуса.
//
// В отличие от страницы /bookmarks, здесь фильтр по статусу серверный: при
// смене статуса перезапрашиваем /bookmarks/?status=... Можно переключить статус
// книги прямо в карточке (эмодзи-кнопки) или удалить закладку.
// Статусы/эмодзи берём из общих констант.
// =============================================================================
export default function BookmarksTab() {
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('Planned'); // активный статус-фильтр
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      // Бэк кладёт в каждую закладку объект book — отдельные запросы не нужны.
      setBookmarks(await getBookmarks(selectedStatus));
    } catch (err) {
      console.error('Ошибка загрузки закладок:', err);
    } finally {
      setLoading(false);
    }
  };

  // Перезагружаем список при каждой смене выбранного статуса.
  useEffect(() => {
    fetchBookmarks();
  }, [selectedStatus]);

  // Смена статуса книги (upsert на бэке: тот же эндпоинт, что и добавление).
  const handleStatusChange = async (bookId, newStatus) => {
    try {
      await setBookmark(bookId, newStatus);
      if (newStatus === selectedStatus) {
        // Книга остаётся в текущем списке — перезагружаем, чтобы подтянуть актуальное.
        fetchBookmarks();
      } else {
        // Закладка ушла в другую категорию — убираем её из текущего списка локально.
        setBookmarks(bookmarks.filter((b) => b.book_id !== bookId));
      }
    } catch (err) {
      console.error('Ошибка при изменении статуса:', err.response?.data || err.message);
      toast.error('Ошибка при изменении статуса');
    }
  };

  const handleDeleteBookmark = async (bookId) => {
    try {
      await removeBookmark(bookId);
      // Оптимистично убираем из списка (без повторной загрузки).
      setBookmarks(bookmarks.filter((b) => b.book_id !== bookId));
    } catch {
      toast.error('Ошибка при удалении закладки');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Переключатель статуса (серверный фильтр) */}
      <div className="flex flex-wrap gap-2">
        {BOOKMARK_STATUS_KEYS.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {statusEmojiLabel(status)}
          </button>
        ))}
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">Нет закладок в этой категории</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookmarks.map((bookmark) => {
            const book = bookmark.book || {};
            return (
              <div
                key={bookmark.id}
                className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex gap-4"
              >
                {/* Обложка-ссылка на страницу книги (или эмодзи-заглушка) */}
                <Link
                  to={`/books/${book.google_id || ''}`}
                  className="w-20 h-28 flex-shrink-0 rounded overflow-hidden bg-slate-700 group"
                >
                  {book.cover_url ? (
                    <img
                      src={secureUrl(book.cover_url)}
                      alt={book.title || 'Обложка книги'}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/books/${book.google_id || ''}`}>
                    <h3 className="text-white font-bold line-clamp-2 hover:text-blue-400 transition">
                      {book.title || `Книга #${bookmark.book_id}`}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                    {formatAuthors(book)}
                  </p>

                  {/* Быстрая смена статуса (эмодзи) + удаление */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {BOOKMARK_STATUS_KEYS.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(bookmark.book_id, status)}
                        title={statusEmojiLabel(status)}
                        className={`text-xs px-2 py-1 rounded transition ${
                          bookmark.status === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {BOOKMARK_STATUS_MAP[status].emoji}
                      </button>
                    ))}
                    <button
                      onClick={() => handleDeleteBookmark(bookmark.book_id)}
                      className="text-xs px-2 py-1 rounded bg-red-900/20 text-red-400 hover:bg-red-900/40 transition ml-auto"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
