import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { BookGridSkeleton } from '../../components/Skeleton/Skeleton';

// Цвета для разных статусов закладки
const statusStyles = {
  Planned: 'bg-slate-800 text-slate-300 border-slate-600',
  Reading: 'bg-blue-900/50 text-blue-400 border-blue-800',
  Finished: 'bg-green-900/50 text-green-400 border-green-800',
  Dropped: 'bg-red-900/50 text-red-400 border-red-800'
};

const statusLabels = {
  Planned: 'В планах',
  Reading: 'Читаю',
  Finished: 'Прочитано',
  Dropped: 'Брошено'
};

const STATUS_FILTERS = ['all', 'Planned', 'Reading', 'Finished', 'Dropped'];
const filterLabels = { all: 'Все', ...statusLabels };

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        // Один запрос: бэкенд возвращает массив, где внутри каждой закладки уже есть объект book
        const res = await api.get('/api/v1/bookmarks/');
        setBookmarks(res.data);
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

  // Счётчики по статусам для бейджей на чипсах
  const counts = bookmarks.reduce((acc, bm) => {
    acc[bm.status] = (acc[bm.status] || 0) + 1;
    return acc;
  }, {});

  // Фильтрация по статусу + поиск по названию/автору (клиентская, мгновенная)
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
            {/* Панель поиска и фильтров */}
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
                      {filterLabels[key]} <span className="opacity-70">{count}</span>
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

                  return (
                    <Link key={bm.id} to={`/books/${book.google_id || ''}`} className="group flex flex-col h-full">
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg transition duration-300 hover:border-blue-500 hover:shadow-blue-900/20 flex flex-col h-full">

                        {/* Обложка и бейдж статуса */}
                        <div className="relative h-64 overflow-hidden bg-slate-950 flex-shrink-0">
                          <img
                            src={book.cover_url || '/placeholder-book.jpg'}
                            alt={book.title || 'Обложка книги'}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                          />
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border shadow-lg backdrop-blur-md ${statusStyles[bm.status] || statusStyles.Planned}`}>
                              {statusLabels[bm.status] || bm.status}
                            </span>
                          </div>
                        </div>

                        {/* Информация о книге */}
                        <div className="p-4 flex-1 flex flex-col justify-start">
                          <h3 className="font-semibold text-slate-200 line-clamp-2 leading-snug group-hover:text-blue-400 transition">
                            {book.title || 'Без названия'}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                            {book.authors && book.authors.length > 0
                              ? book.authors.map((a) => a.name).join(', ')
                              : 'Автор не указан'}
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
