// =============================================================================
// Скелетоны-заглушки для состояний загрузки (пульсация animate-pulse).
// Показываются, пока грузятся данные, вместо пустого экрана/спиннера:
//  - BookGridSkeleton — сетка карточек книг (поиск, тренды, библиотека);
//  - ReviewListSkeleton — список карточек рецензий.
// count задаёт число заглушек.
// =============================================================================

export function BookCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-xl bg-slate-800 h-64 w-full" />
      <div className="mt-3 h-4 bg-slate-800 rounded w-3/4" />
      <div className="mt-2 h-3 bg-slate-800 rounded w-1/2" />
    </div>
  );
}

export function BookGridSkeleton({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-800" />
        <div className="space-y-2">
          <div className="h-3 w-32 bg-slate-800 rounded" />
          <div className="h-2 w-20 bg-slate-800 rounded" />
        </div>
      </div>
      <div className="h-20 bg-slate-800/60 rounded-xl" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-slate-800 rounded-lg" />
        <div className="h-5 w-16 bg-slate-800 rounded-lg" />
        <div className="h-5 w-16 bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

export function ReviewListSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}
