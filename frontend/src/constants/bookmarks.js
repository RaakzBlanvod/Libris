// =============================================================================
// Константы статусов закладок (библиотеки пользователя).
//
// Зачем файл: статусы Planned/Reading/Finished/Dropped и их оформление
// (подписи, эмодзи, цвета бейджей и полос) раньше дублировались в четырёх
// местах (BookmarksPage, BookmarksTab, BookDetailPage, ProfileStats) — местами
// с разными формулировками. Здесь — единый источник правды, чтобы подписи и
// цвета не разъезжались.
//
// Ключи (`key`) совпадают со значениями статусов на бэкенде
// (см. BookmarkStatus в backend/src/modules/bookmarks/schemas.py).
// =============================================================================

// Порядок важен: в таком виде статусы рисуются в фильтрах и списках.
export const BOOKMARK_STATUSES = [
  {
    key: 'Planned',
    label: 'В планах',
    emoji: '📋',
    // Классы бейджа статуса (на обложке книги в библиотеке).
    badge: 'bg-slate-800 text-slate-300 border-slate-600',
    // Цвет полосы прогресса в статистике профиля.
    bar: 'bg-slate-500',
  },
  {
    key: 'Reading',
    label: 'Читаю',
    emoji: '📖',
    badge: 'bg-blue-900/50 text-blue-400 border-blue-800',
    bar: 'bg-blue-500',
  },
  {
    key: 'Finished',
    label: 'Прочитано',
    emoji: '✅',
    badge: 'bg-green-900/50 text-green-400 border-green-800',
    bar: 'bg-emerald-500',
  },
  {
    key: 'Dropped',
    label: 'Брошено',
    emoji: '❌',
    badge: 'bg-red-900/50 text-red-400 border-red-800',
    bar: 'bg-red-500',
  },
];

// Только ключи статусов — удобно для итерации по кнопкам-фильтрам.
export const BOOKMARK_STATUS_KEYS = BOOKMARK_STATUSES.map((s) => s.key);

// Быстрый доступ по ключу: BOOKMARK_STATUS_MAP['Reading'].label и т.п.
export const BOOKMARK_STATUS_MAP = Object.fromEntries(
  BOOKMARK_STATUSES.map((s) => [s.key, s])
);

// Подпись статуса ('Читаю'); если статус неизвестен — возвращаем сам ключ.
export const statusLabel = (key) => BOOKMARK_STATUS_MAP[key]?.label || key;

// Подпись с эмодзи ('📖 Читаю') — для кнопок выбора статуса.
export const statusEmojiLabel = (key) => {
  const s = BOOKMARK_STATUS_MAP[key];
  return s ? `${s.emoji} ${s.label}` : key;
};
