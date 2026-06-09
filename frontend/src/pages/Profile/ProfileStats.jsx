import { useState, useEffect } from 'react';
import { getMyReviews } from '@/api/reviews';
import { getBookmarks } from '@/api/bookmarks';
import { BOOKMARK_STATUSES } from '@/constants/bookmarks';

// =============================================================================
// Вкладка «Профиль» → блок статистики пользователя.
//
// Считает всё на клиенте из двух списков: мои рецензии (/reviews/my) и мои
// закладки (/bookmarks/). Показывает: число рецензий, среднюю выставленную
// оценку, собранные лайки, гистограмму распределения оценок и разбивку
// библиотеки по статусам. Статусы и их цвета берём из общих констант.
// =============================================================================

// Небольшая карточка-цифра (Рецензий / Средняя оценка / Лайков).
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

  // Тянем рецензии и закладки параллельно; при ошибке любого — пустой список
  // (статистика просто покажет нули, а не падает).
  useEffect(() => {
    const load = async () => {
      try {
        // Обе функции гарантируют массив (защита внутри API-слоя),
        // .catch — на случай сетевой ошибки.
        const [rev, bm] = await Promise.all([
          getMyReviews().catch(() => []),
          getBookmarks().catch(() => []),
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

  // --- Производные метрики ---
  const reviewsCount = reviews.length;
  // Средняя из выставленных оценок (overall_rating каждой рецензии).
  const avgGiven = reviewsCount
    ? (reviews.reduce((s, r) => s + (r.overall_rating || 0), 0) / reviewsCount).toFixed(1)
    : '—';
  const totalLikes = reviews.reduce((s, r) => s + (r.like_count || 0), 0);

  // Гистограмма: сколько рецензий попало в каждую целую оценку 1..10
  // (округляем overall_rating и кладём в соответствующую корзину).
  const dist = Array.from({ length: 10 }, () => 0);
  reviews.forEach((r) => {
    const bucket = Math.round(r.overall_rating || 0);
    if (bucket >= 1 && bucket <= 10) dist[bucket - 1] += 1;
  });
  const maxDist = Math.max(1, ...dist); // максимум — для нормировки высоты столбцов

  // Разбивка библиотеки по статусам (берём порядок/цвета из общих констант).
  const libTotal = bookmarks.length;
  const statusCounts = BOOKMARK_STATUSES.map((s) => ({
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

      {/* Гистограмма распределения выставленных оценок (только если есть рецензии) */}
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

      {/* Библиотека по статусам: полоса прогресса на каждый статус */}
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
                    className={`h-full ${s.bar} rounded-full`}
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
