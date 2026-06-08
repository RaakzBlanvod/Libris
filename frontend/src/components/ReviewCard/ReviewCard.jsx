import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AvatarCircle } from '../Avatar/Avatar';

// =============================================================================
// Карточка рецензии — используется на странице книги, в трендах и на главной.
//
// Возможности:
//  - лайк с оптимистичным обновлением (мгновенно переключаем UI, при ошибке
//    откатываем; счётчик крутим сами, т.к. эндпоинт лайка отдаёт только is_liked);
//  - сворачиваемый «подробный разбор» по критериям;
//  - кнопки «Редактировать/Удалить» — только у владельца (currentUserId) и
//    только если переданы обработчики onEdit/onDelete;
//  - showBook=true показывает строку «к какой книге рецензия» (см. ниже).
// =============================================================================
export default function ReviewCard({ review, currentUserId, onEdit, onDelete, showBook = false }) {
  // Достаем данные. Если на бэке поле называется general_text, берем его, иначе text
  const { id, user, plot_rating, characters_rating, style_rating, pacing_rating, world_rating, general_text, text, created_at } = review;
  const reviewText = general_text || text;

  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Состояние лайка живет локально: бэк отдает is_liked/like_count в самой рецензии,
  // а эндпоинт лайка возвращает только новое is_liked — счетчик крутим сами.
  const [isLiked, setIsLiked] = useState(!!review.is_liked);
  const [likeCount, setLikeCount] = useState(review.like_count || 0);
  const [liking, setLiking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Список рецензий мог обновиться (докрашивание лайков, повторная загрузка),
  // а key у карточки не меняется — синхронизируем локальный стейт с пропами.
  useEffect(() => {
    setIsLiked(!!review.is_liked);
    setLikeCount(review.like_count || 0);
  }, [review.is_liked, review.like_count]);

  // Считаем среднюю оценку по всем критериям (если они пришли с бэка)
  const ratings = [plot_rating, characters_rating, style_rating, pacing_rating, world_rating].filter(Boolean);
  const averageRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

  // Развёрнутые обоснования по каждому критерию (бэк хранит и отдаёт их в рецензии)
  const criteria = [
    { label: 'Сюжет', rating: plot_rating, text: review.plot_text },
    { label: 'Персонажи', rating: characters_rating, text: review.characters_text },
    { label: 'Атмосфера и стиль', rating: style_rating, text: review.style_text },
    { label: 'Темп и динамика', rating: pacing_rating, text: review.pacing_text },
    { label: 'Мироустройство', rating: world_rating, text: review.world_text },
  ];
  const detailedCriteria = criteria.filter((c) => c.text);

  // Хозяин рецензии видит кнопки редактирования/удаления (если переданы обработчики)
  const isOwner = currentUserId && user?.id === currentUserId;

  const formattedDate = new Date(created_at).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleLike = async () => {
    // Гостя отправляем логиниться
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (liking) return;

    // Оптимистично переключаем UI, при ошибке откатываем
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setLiking(true);
    setIsLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));

    try {
      const res = await api.post(`/api/v1/reviews/${id}/like`);
      const serverLiked = res.data?.is_liked;
      // Синхронизируемся с ответом сервера (на случай рассинхрона)
      if (typeof serverLiked === 'boolean' && serverLiked !== !prevLiked) {
        setIsLiked(serverLiked);
        setLikeCount(prevCount + (serverLiked ? 1 : 0) - (prevLiked ? 1 : 0));
      }
    } catch (err) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      console.error('Не удалось поставить лайк:', err);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* К какой книге относится рецензия (для трендов/лучших рецензий).
          Если у книги есть google_id — это ссылка на страницу книги,
          иначе показываем только название (ссылку включит бэкенд, добавив google_id). */}
      {showBook && review.book?.title && (
        review.book.google_id ? (
          <Link
            to={`/books/${review.book.google_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            📖 Рецензия на книгу «{review.book.title}»
          </Link>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-sm text-slate-400 font-medium">
            📖 Рецензия на книгу «{review.book.title}»
          </p>
        )
      )}

      {/* Шапка: Автор и дата */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AvatarCircle avatar={user?.avatar} username={user?.username} size="md" />
          <div>
            <h4 className="font-semibold text-white">{user?.username || 'Пользователь'}</h4>
            <p className="text-xs text-slate-500">{formattedDate}</p>
          </div>
        </div>

        {/* Средняя оценка */}
        {averageRating && (
          <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-900 px-3 py-1 rounded-xl text-amber-400 font-bold text-sm">
            <span>★</span>
            <span>{averageRating}</span>
          </div>
        )}
      </div>

      {/* Текст рецензии */}
      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
        {reviewText}
      </p>

      {/* Мини-оценки по категориям (скрытые, если их нет) */}
      {ratings.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {plot_rating && <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">Сюжет: <strong className="text-slate-200">{plot_rating}</strong></span>}
          {characters_rating && <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">Персонажи: <strong className="text-slate-200">{characters_rating}</strong></span>}
          {style_rating && <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">Атмосфера: <strong className="text-slate-200">{style_rating}</strong></span>}
          {pacing_rating && <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">Динамика: <strong className="text-slate-200">{pacing_rating}</strong></span>}
          {world_rating && <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">Мир: <strong className="text-slate-200">{world_rating}</strong></span>}
        </div>
      )}

      {/* Подробный разбор по критериям */}
      {detailedCriteria.length > 0 && (
        <div className="pt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'Скрыть подробный разбор' : 'Показать подробный разбор'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {detailedCriteria.map((c) => (
                <div key={c.label} className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-200">{c.label}</span>
                    {c.rating && <span className="text-xs text-amber-400 font-bold">★ {c.rating}</span>}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Лайки и действия владельца */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-60 ${
            isLiked
              ? 'bg-rose-950/40 text-rose-400 border border-rose-900'
              : 'bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-700'
          }`}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likeCount}</span>
        </button>

        {isOwner && (onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1.5 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 transition"
              >
                Редактировать
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 transition"
              >
                Удалить
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
