import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AvatarCircle } from '../../components/Avatar/Avatar';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import EditReviewModal from './EditReviewModal';

// =============================================================================
// Вкладка «Профиль → Мои рецензии».
//
// Грузит /reviews/my (рецензии текущего пользователя; в ответе есть book с
// google_id, поэтому название книги — ссылка на её страницу). Позволяет
// редактировать (EditReviewModal) и удалять рецензии (с подтверждением).
// =============================================================================
export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const fetchReviews = async () => {
    try {
      const res = await api.get('/api/v1/reviews/my');
      setReviews(res.data);
    } catch (err) {
      console.error('Ошибка загрузки рецензий:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (reviewId) => {
    const ok = await confirm({
      title: 'Удалить рецензию',
      message: 'Вы уверены, что хотите удалить рецензию?',
      confirmText: 'Удалить',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/reviews/${reviewId}`);
      setReviews(reviews.filter(r => r.id !== reviewId));
      toast.success('Рецензия удалена');
    } catch {
      toast.error('Ошибка при удалении рецензии');
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowEditModal(true);
  };

  const handleUpdateReview = () => {
    fetchReviews();
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">У вас еще нет рецензий</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <AvatarCircle avatar={review.user?.avatar} username={review.user?.username} size="sm" />
              <div>
                {review.book?.google_id ? (
                  <Link
                    to={`/books/${review.book.google_id}`}
                    className="text-white font-bold hover:text-blue-400 transition"
                  >
                    {review.book.title}
                  </Link>
                ) : (
                  <h3 className="text-white font-bold">{review.book?.title || 'Книга удалена'}</h3>
                )}
                <p className="text-slate-500 text-xs">{review.user?.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditReview(review)}
                className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded bg-blue-900/20 hover:bg-blue-900/40 transition"
              >
                Редактировать
              </button>
              <button
                onClick={() => handleDeleteReview(review.id)}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded bg-red-900/20 hover:bg-red-900/40 transition"
              >
                Удалить
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-3 text-sm">
            <span className="text-slate-400">Оценка: <span className="text-yellow-400 font-bold">{review.overall_rating}/10</span></span>
            <span className="text-slate-400">Лайков: <span className="text-pink-400">{review.like_count}</span></span>
          </div>

          {review.general_text && (
            <p className="text-slate-300 text-sm mb-3 whitespace-pre-wrap break-words">{review.general_text}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-400">
            {review.plot_rating > 0 && <div>📖 Сюжет: {review.plot_rating}</div>}
            {review.characters_rating > 0 && <div>👥 Персонажи: {review.characters_rating}</div>}
            {review.style_rating > 0 && <div>✍️ Стиль: {review.style_rating}</div>}
            {review.pacing_rating > 0 && <div>⚡ Темп: {review.pacing_rating}</div>}
            {review.world_rating > 0 && <div>🌍 Мир: {review.world_rating}</div>}
          </div>
        </div>
      ))}

      {showEditModal && editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdateReview}
        />
      )}
    </div>
  );
}
