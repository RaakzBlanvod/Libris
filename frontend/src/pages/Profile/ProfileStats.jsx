import { useState, useEffect } from 'react';
import api from '../../api/client';

const STATUS_META = [
  { key: 'Planned', label: 'В планах', color: 'bg-slate-500' },
  { key: 'Reading', label: 'Читаю', color: 'bg-blue-500' },
  { key: 'Finished', label: 'Прочитано', color: 'bg-emerald-500' },
  { key: 'Dropped', label: 'Брошено', color: 'bg-red-500' },
];

function StatCard({ value, label }) {
  return (
    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 text-center">
      <div className="text-3xl font-extrabold text-blue-400">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">{label}</div>
    </div>
  );
}

export default function ProfileStats() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [rev, bm] = await Promise.all([
          api.get('/api/v1/reviews/my').then((r) => r.data).catch(() => []),
          api.get('/api/v1/bookmarks/').then((r) => r.data).catch(() => []),
        ]);
        setReviews(rev);
        setBookmarks(bm);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const reviewsCount = reviews.length;
  const avgGiven = reviewsCount
    ? (reviews.reduce((s, r) => s + (r.overall_rating || 0), 0) / reviewsCount).toFixed(1)
    : '—';
  const totalLikes = reviews.reduce((s, r) => s + (r.like_count || 0), 0);

  // Распределение по округлённой средней оценке (1..10)
  const dist = Array.from({ length: 10 }, () => 0);
  reviews.forEach((r) => {
    const bucket = Math.round(r.overall_rating || 0);
    if (bucket >= 1 && bucket <= 10) dist[bucket - 1] += 1;
  });
  const maxDist = Math.max(1, ...dist);

  const libTotal = bookmarks.length;
  const statusCounts = STATUS_META.map((s) => ({
    ...s,
    count: bookmarks.filter((b) => b.status === s.key).length,
  }));

  return (
    <div className="space-y-6">
      {/* Сводные цифры */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={reviewsCount} label="Рецензий" />
        <StatCard value={avgGiven} label="Средняя оценка" />
        <StatCard value={totalLikes} label="Лайков собрано" />
      </div>

      {/* Распределение выставленных оценок */}
      {reviewsCount > 0 && (
        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
          <h3 className="text-white font-bold mb-4">Как вы оцениваете книги</h3>
          <div className="flex items-end gap-1.5 h-32">
            {dist.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-xs text-slate-500">{count || ''}</span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-blue-600 to-emerald-500"
                  style={{ height: `${(count / maxDist) * 100}%`, minHeight: count ? '4px' : '2px' }}
                ></div>
                <span className="text-xs text-slate-500">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Библиотека по статусам */}
      <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
        <h3 className="text-white font-bold mb-4">Библиотека ({libTotal})</h3>
        {libTotal === 0 ? (
          <p className="text-slate-500 text-sm">Пока ничего не добавлено.</p>
        ) : (
          <div className="space-y-3">
            {statusCounts.map((s) => (
              <div key={s.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="text-slate-300 font-medium">{s.count}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full`}
                    style={{ width: `${libTotal ? (s.count / libTotal) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
