import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Bookmark, MessageSquare } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import ReviewCard from '../../components/ReviewCard/ReviewCard';
import EditReviewModal from '../Profile/EditReviewModal';
import { ReviewListSkeleton } from '../../components/Skeleton/Skeleton';
import { BOOKMARK_STATUSES, statusEmojiLabel } from '../../constants/bookmarks';
import { sortReviews } from '../../utils/sortReviews';
import { formatAuthors } from '../../utils/formatAuthors';

// =============================================================================
// Страница книги (маршрут /books/:id, где :id — google_id).
//
// Собирает на одной странице: данные книги, управление закладкой (статус в
// библиотеке), список рецензий с сортировкой и блок «похожие книги».
//
// Ключевой нюанс с идентификаторами: в URL и в Google-поиске книга известна по
// google_id, а закладки и рецензии работают по ВНУТРЕННЕМУ book.id из нашей БД.
// Поэтому сначала грузим книгу (получаем book.id), и только потом — рецензии.
// =============================================================================
export default function BookDetailPage() {
  const { id } = useParams(); // google_id из URL
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkStatus, setBookmarkStatus] = useState(null); // null — книги нет в библиотеке
  const [editingReview, setEditingReview] = useState(null); // рецензия, открытая в модалке
  const [reviewSort, setReviewSort] = useState('new'); // режим сортировки рецензий
  const [similarBooks, setSimilarBooks] = useState([]);

  // Грузим книгу и (для авторизованного) его закладки, чтобы понять статус книги.
  useEffect(() => {
    if (!id) return;
    const loadPageData = async () => {
      try {
        const [bookRes, bookmarksRes] = await Promise.all([
          api.get(`/api/v1/books/${id}`),
          // Закладки только для залогиненного; гостю — пустой список.
          currentUser
            ? api.get('/api/v1/bookmarks/').then((r) => r.data).catch(() => [])
            : Promise.resolve([]),
        ]);
        setBook(bookRes.data);
        // Ищем эту книгу среди закладок пользователя по внутреннему id.
        const bm = bookmarksRes.find((b) => b.book_id === bookRes.data.id);
        setBookmarkStatus(bm ? bm.status : null);
      } catch {
        setError('Не удалось загрузить данные книги.');
      }
    };
    loadPageData();
  }, [id, currentUser]);

  // Рецензии грузим отдельно — нужен внутренний book.id (появляется после загрузки книги).
  const loadReviews = async () => {
    if (!book?.id) return;
    setLoadingReviews(true);
    try {
      const res = await api.get(`/api/v1/reviews/book/${book.id}`);
      setReviews(res.data);
    } catch (err) {
      console.error('Не удалось загрузить рецензии:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [book?.id]);

  // Похожие книги: ищем по первому автору и убираем из выдачи саму книгу.
  // cancelled-флаг защищает от гонки, если книга сменится до ответа.
  useEffect(() => {
    const author = book?.authors?.[0]?.name;
    if (!author) {
      setSimilarBooks([]);
      return;
    }
    let cancelled = false;
    api
      .get(`/api/v1/books/search?q=${encodeURIComponent(author)}&limit=12`)
      .then((res) => {
        if (cancelled) return;
        setSimilarBooks(res.data.filter((b) => b.google_id !== book.google_id).slice(0, 5));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [book?.google_id]);

  // Добавить книгу/сменить её статус в библиотеке (один upsert-эндпоинт).
  const handleSetStatus = async (status) => {
    if (!currentUser) {
      navigate('/login'); // гостя — логиниться
      return;
    }
    if (!book?.id) return;
    try {
      await api.post('/api/v1/bookmarks/', { book_id: book.id, status });
      setBookmarkStatus(status);
    } catch {
      toast.error('Не удалось изменить статус закладки.');
    }
  };

  const handleRemoveBookmark = async () => {
    if (!book?.id) return;
    try {
      await api.delete(`/api/v1/bookmarks/${book.id}`);
      setBookmarkStatus(null);
    } catch {
      toast.error('Не удалось убрать книгу из библиотеки.');
    }
  };

  // Удаление рецензии (с подтверждением). После удаления перезагружаем рецензии
  // и саму книгу — у неё пересчитался средний рейтинг и счётчик рецензий.
  const handleDeleteReview = async (reviewId) => {
    const ok = await confirm({
      title: 'Удалить рецензию',
      message: 'Вы уверены? Это действие необратимо.',
      confirmText: 'Удалить',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/reviews/${reviewId}`);
      await loadReviews();
      const res = await api.get(`/api/v1/books/${id}`);
      setBook(res.data);
      toast.success('Рецензия удалена');
    } catch {
      toast.error('Не удалось удалить рецензию.');
    }
  };

  // После редактирования рецензии — закрываем модалку и обновляем данные/рейтинг.
  const handleReviewUpdated = async () => {
    setEditingReview(null);
    await loadReviews();
    const res = await api.get(`/api/v1/books/${id}`);
    setBook(res.data);
  };

  if (error) return <div className="min-h-screen bg-slate-950 p-20 text-center text-red-400 font-semibold">{error}</div>;
  if (!book) return <div className="min-h-screen bg-slate-950 p-20 text-center text-slate-500">Загрузка данных...</div>;

  // Рецензия текущего пользователя на эту книгу (если уже оставлял) —
  // чтобы показать «Вы уже оставили рецензию» вместо кнопки создания.
  const myReview = currentUser ? reviews.find((r) => r.user?.id === currentUser.id) : null;

  // Сортировка рецензий выбранным способом (общая утилита).
  const sortedReviews = sortReviews(reviews, reviewSort);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-200">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* СЕКЦИЯ С КНИГОЙ: обложка + действия слева, описание справа */}
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <img src={book.cover_url || '/placeholder-book.jpg'} alt={book.title} className="w-full rounded-2xl shadow-2xl border border-slate-800" />

            {/* Закладка: если книга уже в библиотеке — выбор статуса, иначе кнопка добавления */}
            {bookmarkStatus ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Статус в библиотеке</p>
                <div className="grid grid-cols-2 gap-2">
                  {BOOKMARK_STATUSES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleSetStatus(s.key)}
                      className={`text-sm py-2 rounded-lg font-medium transition ${
                        bookmarkStatus === s.key
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {statusEmojiLabel(s.key)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleRemoveBookmark}
                  className="w-full text-sm text-rose-400 hover:text-rose-300 transition py-1"
                >
                  Удалить из библиотеки
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleSetStatus('Planned')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition"
              >
                <Bookmark size={20} />
                Добавить в библиотеку
              </button>
            )}

            {/* Кнопка рецензии: либо «уже оставили», либо переход к созданию (гостя — на логин) */}
            {myReview ? (
              <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-slate-900 text-slate-400 border border-slate-800">
                <MessageSquare size={20} />
                Вы уже оставили рецензию
              </div>
            ) : (
              <button
                onClick={() => navigate(currentUser ? `/books/${id}/review` : '/login')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition"
              >
                <MessageSquare size={20} />
                Составить рецензию
              </button>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2">{book.title}</h1>
              <p className="text-xl text-slate-400 font-medium">{formatAuthors(book)}</p>
            </div>

            {/* Рейтинг и характеристики книги (показываем только заполненные) */}
            <div className="flex flex-wrap items-center gap-3">
              {book.average_rating > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-900 px-3 py-1.5 rounded-xl text-amber-400 font-bold">
                  <span>★</span>
                  <span>{book.average_rating.toFixed(1)}</span>
                </div>
              )}
              <span className="text-sm text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                {book.reviews_count || 0} рецензий
              </span>
              {book.page_count > 0 && (
                <span className="text-sm text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  {book.page_count} стр.
                </span>
              )}
              {book.isbn && (
                <span className="text-sm text-slate-500 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  ISBN {book.isbn}
                </span>
              )}
            </div>

            {/* Жанры */}
            {book.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {book.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="bg-slate-800 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-medium border border-slate-700"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Описание</h3>
              <p className="text-lg text-slate-300 leading-relaxed">
                {book.description || 'Описание для этой книги пока отсутствует.'}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* СЕКЦИЯ РЕЦЕНЗИЙ: заголовок со счётчиком + сортировка + список */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Рецензии читателей
              <span className="text-sm font-normal text-slate-500 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                {reviews.length}
              </span>
            </h2>
            {/* Сортировку показываем, только когда есть что сортировать (>1) */}
            {reviews.length > 1 && (
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="new">Сначала свежие</option>
                <option value="rating">По оценке</option>
                <option value="likes">По лайкам</option>
              </select>
            )}
          </div>

          {loadingReviews ? (
            <ReviewListSkeleton count={2} />
          ) : reviews.length === 0 ? (
            <div className="bg-slate-900/50 rounded-2xl p-12 text-center text-slate-500 border border-dashed border-slate-800">
              Здесь пока пусто. Станьте первым, кто напишет детальный разбор!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {/* currentUserId включает кнопки «Редактировать/Удалить» у своих рецензий */}
              {sortedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUserId={currentUser?.id}
                  onEdit={setEditingReview}
                  onDelete={handleDeleteReview}
                />
              ))}
            </div>
          )}
        </div>

        {/* ПОХОЖИЕ КНИГИ (по первому автору) */}
        {similarBooks.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Похожие книги</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {similarBooks.map((b) => (
                <Link key={b.google_id} to={`/books/${b.google_id}`} className="group">
                  <div className="overflow-hidden rounded-xl shadow-lg border border-slate-800 bg-slate-900">
                    <img
                      src={b.cover_url || '/placeholder-book.jpg'}
                      alt={b.title}
                      className="w-full h-56 object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-slate-200 line-clamp-2">{b.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Модалка редактирования рецензии (рендерится поверх при editingReview) */}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onUpdate={handleReviewUpdated}
        />
      )}
    </div>
  );
}
