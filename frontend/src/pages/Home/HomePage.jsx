import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MessageSquare, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import { getLikedReviewIds, dockLikes } from '../../api/reviews';
import { useAuth } from '../../context/AuthContext';
import ReviewCard from '../../components/ReviewCard/ReviewCard';
import { BookGridSkeleton } from '../../components/Skeleton/Skeleton';
import { formatAuthors } from '../../utils/formatAuthors';
import { secureUrl } from '../../utils/secureUrl';

// =============================================================================
// Главная страница (лендинг + поиск).
//
// Два режима в одном компоненте:
//  - поиск (когда в строке >= 2 символов): живой поиск книг с debounce и
//    кнопкой «Показать ещё» (растим limit до MAX_LIMIT);
//  - лендинг (пустой/короткий запрос): быстрые ссылки (для авторизованных),
//    тренды книг, подборки по жанрам (карусель) и лучшие рецензии недели.
// Подборки по жанрам кешируются в genreCache, чтобы не дёргать сеть повторно.
// =============================================================================

const SEARCH_PAGE = 12; // шаг пагинации поиска
const MAX_LIMIT = 40; // ограничение бэка на size поиска

const GENRES = ['Фэнтези', 'Фантастика', 'Детектив', 'Роман', 'Психология', 'История', 'Бизнес', 'Приключения'];

// Карточка книги в сетке/карусели.
function BookCard({ book }) {
  return (
    <Link to={`/books/${book.google_id}`} className="group">
      <div className="overflow-hidden rounded-xl shadow-lg border border-slate-800 bg-slate-900">
        <img
          src={secureUrl(book.cover_url) || '/placeholder-book.jpg'}
          alt={book.title}
          className="w-full h-64 object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <h3 className="mt-3 font-semibold text-slate-200 truncate">{book.title}</h3>
      <p className="text-sm text-slate-500 truncate">{formatAuthors(book)}</p>
    </Link>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [limit, setLimit] = useState(SEARCH_PAGE);

  const [trendingBooks, setTrendingBooks] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  const [trendingReviews, setTrendingReviews] = useState([]);

  const [activeGenre, setActiveGenre] = useState(GENRES[0]);
  const [genreBooks, setGenreBooks] = useState([]);
  const [loadingGenre, setLoadingGenre] = useState(true);
  const genreCache = useRef({}); // жанр -> список книг, чтобы не дёргать сеть повторно
  const carouselRef = useRef(null);

  const scrollCarousel = (dir) => {
    carouselRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });
  };

  const trimmed = searchQuery.trim();
  const isSearchMode = trimmed.length >= 2;

  // Тренды книг и рецензий для лендинга
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Тренды рецензий приходят из кэша с is_liked=false — докрашиваем
        // сердечки списком лайкнутых ID, иначе лайк «слетает» после refresh.
        const [books, reviews, likedIds] = await Promise.all([
          api.get('/api/v1/books/trending').then((r) => r.data).catch(() => []),
          api.get('/api/v1/reviews/trending').then((r) => r.data).catch(() => []),
          getLikedReviewIds(user),
        ]);
        setTrendingBooks(Array.isArray(books) ? books : []);
        setTrendingReviews(dockLikes(reviews, likedIds)); // dockLikes сам защищён от не-массива
      } finally {
        setIsLoadingTrending(false);
      }
    };
    fetchTrending();
  }, [user]);

  // Подборка по выбранному жанру (через поиск книг)
  useEffect(() => {
    // Уже загружали этот жанр — отдаём из кеша мгновенно
    if (genreCache.current[activeGenre]) {
      setGenreBooks(genreCache.current[activeGenre]);
      setLoadingGenre(false);
      return;
    }
    let cancelled = false;
    setLoadingGenre(true);
    api
      .get(`/api/v1/books/search?q=${encodeURIComponent(activeGenre)}&limit=10`)
      .then((res) => {
        if (cancelled) return;
        genreCache.current[activeGenre] = res.data;
        setGenreBooks(res.data);
      })
      .catch(() => {
        if (!cancelled) setGenreBooks([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGenre(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeGenre]);

  // Живой поиск с debounce; перезапускается и при «Показать ещё» (рост limit)
  useEffect(() => {
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(
          `/api/v1/books/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`
        );
        setSearchResults(res.data);
      } catch (err) {
        console.error('Ошибка поиска:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [trimmed, limit]);

  const handleQueryChange = (value) => {
    setSearchQuery(value);
    setLimit(SEARCH_PAGE); // новый запрос — сбрасываем пагинацию
  };

  const canLoadMore = isSearchMode && !isSearching && searchResults.length >= limit && limit < MAX_LIMIT;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Найди свою следующую книгу
        </h1>
        <p className="text-slate-400 mb-8 text-lg">
          Исследуй миллионы книг, читай отзывы и собирай свою идеальную библиотеку.
        </p>

        <form onSubmit={(e) => e.preventDefault()} className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Начните вводить название, автора или жанр..."
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full px-6 py-4 rounded-full bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-lg"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition text-xl"
            >
              ×
            </button>
          )}
        </form>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {isSearchMode ? (
          <div>
            <h2 className="text-2xl font-bold mb-8">Результаты поиска</h2>

            {isSearching && searchResults.length === 0 ? (
              <BookGridSkeleton />
            ) : searchResults.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {searchResults.map((book) => (
                    <BookCard key={book.google_id} book={book} />
                  ))}
                </div>
                {canLoadMore && (
                  <div className="text-center mt-10">
                    <button
                      onClick={() => setLimit((l) => Math.min(l + SEARCH_PAGE, MAX_LIMIT))}
                      className="px-8 py-3 rounded-full bg-slate-900 border border-slate-700 text-slate-200 hover:border-blue-500 hover:text-white transition font-medium"
                    >
                      Показать ещё
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                По вашему запросу ничего не найдено.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-16">
            {/* Быстрый доступ для авторизованных */}
            {user && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link to="/bookmarks" className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-600 transition group">
                  <Bookmark className="text-indigo-400 group-hover:scale-110 transition" size={28} />
                  <div className="text-left">
                    <div className="font-semibold text-slate-200">Моя библиотека</div>
                    <div className="text-xs text-slate-500">Сохранённые книги</div>
                  </div>
                </Link>
                <Link to="/profile" className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-600 transition group">
                  <MessageSquare className="text-blue-400 group-hover:scale-110 transition" size={28} />
                  <div className="text-left">
                    <div className="font-semibold text-slate-200">Мои рецензии</div>
                    <div className="text-xs text-slate-500">Профиль и статистика</div>
                  </div>
                </Link>
                <Link to="/reviews" className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-rose-600 transition group">
                  <Heart className="text-rose-400 group-hover:scale-110 transition" size={28} />
                  <div className="text-left">
                    <div className="font-semibold text-slate-200">Лучшие рецензии</div>
                    <div className="text-xs text-slate-500">Топ за неделю</div>
                  </div>
                </Link>
              </div>
            )}

            {/* Тренды книг */}
            <div>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <span className="text-emerald-400">🔥</span> Сейчас в тренде
              </h2>

              {isLoadingTrending ? (
                <BookGridSkeleton />
              ) : trendingBooks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {trendingBooks.map((book) => (
                    <BookCard key={book.google_id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  Тренды пока формируются.
                </div>
              )}
            </div>

            {/* Подборки по жанрам */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-blue-400">📚</span> Подборки по жанрам
              </h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGenre(g)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                      activeGenre === g
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {loadingGenre ? (
                <BookGridSkeleton count={5} />
              ) : genreBooks.length > 0 ? (
                <div className="relative group/carousel">
                  {/* Стрелки прокрутки (на десктопе по наведению) */}
                  <button
                    onClick={() => scrollCarousel(-1)}
                    aria-label="Назад"
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700 text-white hover:bg-slate-800 transition opacity-0 group-hover/carousel:opacity-100"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div
                    ref={carouselRef}
                    className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-2 -mx-1 px-1"
                  >
                    {genreBooks.map((book) => (
                      <div key={book.google_id} className="w-36 sm:w-40 md:w-44 flex-shrink-0">
                        <BookCard book={book} />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => scrollCarousel(1)}
                    aria-label="Вперёд"
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700 text-white hover:bg-slate-800 transition opacity-0 group-hover/carousel:opacity-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  В этой подборке пока пусто.
                </div>
              )}
            </div>

            {/* Лучшие рецензии недели */}
            {trendingReviews.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-rose-400">❤️</span> Лучшие рецензии недели
                  </h2>
                  <Link to="/reviews" className="text-sm text-slate-400 hover:text-white transition">
                    Все рецензии →
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {trendingReviews.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} showBook />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
