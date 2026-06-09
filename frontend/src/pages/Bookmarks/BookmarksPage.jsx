import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookmarks } from '@/api/bookmarks';
import { BookGridSkeleton } from '@/components/Skeleton/Skeleton';
import { BOOKMARK_STATUS_KEYS, BOOKMARK_STATUS_MAP, statusLabel } from '@/constants/bookmarks';
import { formatAuthors } from '@/utils/formatAuthors';
import { secureUrl } from '@/utils/secureUrl';

// =============================================================================
// Страница «Моя библиотека» (маршрут /bookmarks) — сетка сохранённых книг.
//
// Загружает все закладки одним запросом (бэк кладёт внутрь каждой объект book).
// Поиск по названию/автору и фильтр по статусу — клиентские (мгновенные, без
// обращения к серверу). Оформление статусов берём из общих констант.
// =============================================================================

// Фильтры статуса: «Все» + сами статусы из общих констант.
const STATUS_FILTERS = ['all', ...BOOKMARK_STATUS_KEYS];

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(''); // строка поиска
  const [statusFilter, setStatusFilter] = useState('all'); // активный фильтр статуса

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        // Один запрос: в каждой закладке уже есть объект book (selectinload на бэке).
        setBookmarks(await getBookmarks());
      } catch (err) {
        console.error('Ошибка при получении списка закладок:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Моя библиотека</h1>
          <BookGridSkeleton />
        </div>
      </div>
    );
  }

  // Счётчики книг по каждому статусу — для бейджей на кнопках-фильтрах.
  const counts = bookmarks.reduce((acc, bm) => {
    acc[bm.status] = (acc[bm.status] || 0) + 1;
    return acc;
  }, {});

  // Применяем фильтр по статусу и поиск (по названию и авторам) — на клиенте.
  const q = query.trim().toLowerCase();
  const filtered = bookmarks.filter((bm) => {
    if (statusFilter !== 'all' && bm.status !== statusFilter) return false;
    if (!q) return true;
    const book = bm.book || {};
    const title = (book.title || '').toLowerCase();
    const authors = (book.authors || []).map((a) => a.name).join(' ').toLowerCase();
    return title.includes(q) || authors.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">Моя библиотека</h1>

        {bookmarks.length === 0 ? (
          // Пустая библиотека — приглашение найти книги.
          <div className="bg-slate-900 p-20 text-center text-slate-400 border border-slate-800 rounded-3xl shadow-xl max-w-3xl mx-auto">
            <p className="text-xl mb-4">Ваша библиотека пока пуста.</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition shadow-lg"
            >
              Найти книги
            </Link>
          </div>
        ) : (
          <>
            {/* Панель: поиск + кнопки-фильтры по статусу со счётчиками */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Поиск по названию или автору..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition text-lg"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((key) => {
                  const count = key === 'all' ? bookmarks.length : counts[key] || 0;
                  // 'all' → «Все», остальные — подпись статуса из констант.
                  const label = key === 'all' ? 'Все' : statusLabel(key);
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        statusFilter === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {label} <span className="opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Ничего не найдено. Попробуйте изменить поиск или фильтр.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filtered.map((bm) => {
                  const book = bm.book || {};
                  // Оформление бейджа статуса из констант (фолбэк — стиль 'Planned').
                  const badge = BOOKMARK_STATUS_MAP[bm.status]?.badge || BOOKMARK_STATUS_MAP.Planned.badge;

                  return (
                    <Link key={bm.id} to={`/books/${book.google_id || ''}`} className="group flex flex-col h-full">
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg transition duration-300 hover:border-blue-500 hover:shadow-blue-900/20 flex flex-col h-full">

                        {/* Обложка + бейдж статуса в углу */}
                        <div className="relative h-64 overflow-hidden bg-slate-950 flex-shrink-0">
                          <img
                            src={secureUrl(book.cover_url) || '/placeholder-book.jpg'}
                            alt={book.title || 'Обложка книги'}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                          />
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border shadow-lg backdrop-blur-md ${badge}`}>
                              {statusLabel(bm.status)}
                            </span>
                          </div>
                        </div>

                        {/* Название + авторы */}
                        <div className="p-4 flex-1 flex flex-col justify-start">
                          <h3 className="font-semibold text-slate-200 line-clamp-2 leading-snug group-hover:text-blue-400 transition">
                            {book.title || 'Без названия'}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                            {formatAuthors(book)}
                          </p>
                        </div>

                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
