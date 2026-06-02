import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const BOOKMARK_STATUSES = ['Planned', 'Reading', 'Finished', 'Dropped'];

const statusLabels = {
  Planned: '📋 Планирую',
  Reading: '📖 Читаю',
  Finished: '✅ Прочитано',
  Dropped: '❌ Бросил',
};

const statusIcons = {
  Planned: '📋',
  Reading: '📖',
  Finished: '✅',
  Dropped: '❌',
};

export default function BookmarksTab() {
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('Planned');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      // Бэкенд кладёт в каждую закладку объект book (selectinload),
      // поэтому отдельные запросы за названиями книг не нужны.
      const res = await api.get('/api/v1/bookmarks/', {
        params: { status: selectedStatus },
      });
      setBookmarks(res.data);
    } catch (err) {
      console.error('Ошибка загрузки закладок:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [selectedStatus]);

  const handleStatusChange = async (bookId, newStatus) => {
    try {
      await api.post('/api/v1/bookmarks/', {
        book_id: bookId,
        status: newStatus,
      });
      if (newStatus === selectedStatus) {
        fetchBookmarks();
      } else {
        // Закладка ушла в другую категорию — убираем её из текущего списка.
        setBookmarks(bookmarks.filter((b) => b.book_id !== bookId));
      }
    } catch (err) {
      console.error('Ошибка при изменении статуса:', err.response?.data || err.message);
      toast.error('Ошибка при изменении статуса');
    }
  };

  const handleDeleteBookmark = async (bookId) => {
    try {
      await api.delete(`/api/v1/bookmarks/${bookId}`);
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
      {/* Фильтр по статусу */}
      <div className="flex flex-wrap gap-2">
        {BOOKMARK_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {statusLabels[status]}
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
                {/* Обложка с переходом на книгу */}
                <Link
                  to={`/books/${book.google_id || ''}`}
                  className="w-20 h-28 flex-shrink-0 rounded overflow-hidden bg-slate-700 group"
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
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
                    {book.authors && book.authors.length > 0
                      ? book.authors.map((a) => a.name).join(', ')
                      : 'Автор не указан'}
                  </p>

                  {/* Переключение статуса и удаление */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {BOOKMARK_STATUSES.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(bookmark.book_id, status)}
                        title={statusLabels[status]}
                        className={`text-xs px-2 py-1 rounded transition ${
                          bookmark.status === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {statusIcons[status]}
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
