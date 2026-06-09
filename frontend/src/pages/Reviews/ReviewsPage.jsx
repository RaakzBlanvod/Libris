import { useState, useEffect } from 'react';
import { getTrendingReviews, getLikedReviewIds, dockLikes } from '@/api/reviews';
import { useAuth } from '@/context/AuthContext';
import ReviewCard from '@/components/ReviewCard/ReviewCard';
import { ReviewListSkeleton } from '@/components/Skeleton/Skeleton';
import { sortReviews } from '@/utils/sortReviews';

// =============================================================================
// Страница «Лучшие рецензии» (маршрут /reviews).
//
// Источник — /reviews/trending (топ по лайкам за неделю, кэш Redis). В кэше
// is_liked всегда false, поэтому сердечки «докрашиваем» отдельным запросом
// списка лайкнутых ID (getLikedReviewIds + dockLikes). Локальная сортировка
// (по лайкам/оценке/свежести) — общей утилитой sortReviews.
//
// showBook у карточек включает строку «к какой книге рецензия» со ссылкой
// (бэк отдаёт book.google_id в трендах).
// =============================================================================
export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('likes'); // режим сортировки списка

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Параллельно: сами тренды и список лайкнутых ID текущего пользователя.
        const [trending, likedIds] = await Promise.all([
          getTrendingReviews(),
          getLikedReviewIds(user),
        ]);

        // Проставляем is_liked поверх кэшированных трендов.
        setReviews(dockLikes(trending, likedIds));
      } catch (err) {
        console.error('Ошибка загрузки трендовых рецензий:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, [user]); // перезапрашиваем при логине/логауте (меняется набор лайков)

  // Сортируем копию по выбранному режиму (исходный массив не трогаем).
  const sortedReviews = sortReviews(reviews, sort);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-200">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-rose-400">❤️</span> Лучшие рецензии
            </h1>
            <p className="text-slate-400 mt-2">Самые залайканные разборы за последнюю неделю.</p>
          </div>
          {/* Селектор сортировки показываем только когда есть что сортировать */}
          {reviews.length > 0 && (
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="likes">По лайкам</option>
              <option value="rating">По оценке</option>
              <option value="new">Сначала свежие</option>
            </select>
          )}
        </div>

        {loading ? (
          <ReviewListSkeleton />
        ) : reviews.length === 0 ? (
          <div className="bg-slate-900/50 rounded-2xl p-12 text-center text-slate-500 border border-dashed border-slate-800">
            Пока нет трендовых рецензий. Поставьте лайк понравившимся разборам — и они появятся здесь!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} showBook />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
