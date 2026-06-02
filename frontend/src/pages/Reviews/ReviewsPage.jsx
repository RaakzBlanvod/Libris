import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ReviewCard from '../../components/ReviewCard/ReviewCard';
import { ReviewListSkeleton } from '../../components/Skeleton/Skeleton';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('likes');

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Тренды отдаются из кэша Redis, где is_liked всегда false.
        // Поэтому докрашиваем сердечки отдельным запросом списка лайкнутых ID.
        const [trendingRes, likedIds] = await Promise.all([
          api.get('/api/v1/reviews/trending'),
          user
            ? api.get('/api/v1/reviews/my/likes').then((r) => r.data).catch(() => [])
            : Promise.resolve([]),
        ]);

        const likedSet = new Set(likedIds);
        setReviews(
          trendingRes.data.map((review) => ({
            ...review,
            is_liked: likedSet.has(review.id),
          }))
        );
      } catch (err) {
        console.error('Ошибка загрузки трендовых рецензий:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, [user]);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === 'rating') return (b.overall_rating || 0) - (a.overall_rating || 0);
    if (sort === 'new') return new Date(b.created_at) - new Date(a.created_at);
    return (b.like_count || 0) - (a.like_count || 0);
  });

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
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
