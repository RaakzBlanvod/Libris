import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBook } from '@/api/books';
import { createReview } from '@/api/reviews';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { REVIEW_CATEGORIES as categories, MIN_TEXT, MIN_GENERAL } from '@/constants/reviews';
import RatingStepper from '@/components/RatingStepper/RatingStepper';

// =============================================================================
// Страница создания рецензии на книгу (маршрут /books/:id/review).
//
// Форма из 5 критериев (сюжет/персонажи/стиль/темп/мир): по каждому — оценка
// 1..10 (RatingStepper) и текст-обоснование, плюс общий вывод. Минимальные
// длины текстов берём из констант, совпадающих с валидацией бэка (ReviewBase),
// чтобы не ловить 400. `:id` в URL — это google_id книги; внутренний book.id
// нужен для POST-запроса, поэтому сначала грузим книгу.
// =============================================================================
export default function CreateReview() {
  const { id } = useParams(); // google_id книги из URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [book, setBook] = useState(null); // данные книги (нужен внутренний id)
  const [loading, setLoading] = useState(false); // идёт отправка рецензии

  // Все поля формы в одном объекте: `${критерий}_rating` и `${критерий}_text`
  // + общий вывод. Оценки по умолчанию 5 (середина шкалы 1..10).
  const [formData, setFormData] = useState({
    plot_rating: 5, plot_text: '',
    characters_rating: 5, characters_text: '',
    style_rating: 5, style_text: '',
    pacing_rating: 5, pacing_text: '',
    world_rating: 5, world_text: '',
    general_text: ''
  });

  // Гостя на страницу создания рецензии не пускаем — отправляем логиниться.
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Грузим книгу по google_id из URL (нужен её внутренний id для POST).
  useEffect(() => {
    if (!id) return;
    getBook(id)
      .then(setBook)
      .catch(err => console.error("Ошибка загрузки книги:", err));
  }, [id]);

  // Универсальный апдейтер одного поля формы по имени.
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Клиентская валидация минимальных длин (зеркалит схему бэка) ---
  // Критерии, у которых текст короче минимума, — для подсветки и сообщения.
  const missingCriteria = categories.filter(
    (cat) => formData[`${cat.id}_text`].trim().length < MIN_TEXT
  );
  const generalTooShort = formData.general_text.trim().length < MIN_GENERAL;
  const isValid = missingCriteria.length === 0 && !generalTooShort;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Книга ещё могла не догрузиться — без её внутреннего id отправлять некуда.
    if (!book || !book.id) {
      toast.error("Данные книги ещё не загрузились. Попробуйте снова через секунду.");
      return;
    }

    // Подробно подсказываем, что именно заполнить (до обращения к бэку).
    if (!isValid) {
      const parts = [];
      if (missingCriteria.length) {
        parts.push(`минимум ${MIN_TEXT} симв.: ${missingCriteria.map((c) => c.label).join(', ')}`);
      }
      if (generalTooShort) parts.push(`общий вывод — минимум ${MIN_GENERAL} симв.`);
      toast.error(`Заполните подробнее: ${parts.join('; ')}`);
      return;
    }

    setLoading(true);

    try {
      // Создаём рецензию по внутреннему id книги и возвращаемся на страницу книги.
      await createReview(book.id, formData);
      toast.success("Рецензия успешно опубликована!");
      navigate(`/books/${id}`);
    } catch (err) {
      // Бэк может вернуть detail строкой (бизнес-ошибка) или массивом (валидация).
      const backendError = err.response?.data?.detail;
      if (typeof backendError === 'string') {
        toast.error(backendError);
      } else if (Array.isArray(backendError)) {
        toast.error(`Ошибка валидации: ${backendError.map(e => e.msg).join(', ')}`);
      } else {
        toast.error(`Ошибка ${err.response?.status || 'неизвестна'}: не удалось добавить рецензию.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Пока книга грузится — заглушка (без неё нет заголовка и id).
  if (!book) return <div className="text-white text-center p-20">Загрузка данных книги...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Рецензия на книгу</h1>
        <p className="text-indigo-400 mb-8 font-semibold text-lg">{book.title}</p>

        <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6">
          {/* Строка на каждый критерий: оценка (степпер) + текст-обоснование */}
          {categories.map((cat) => (
            <div key={cat.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-800 pb-4">
              <div className="md:col-span-1">
                <label className="block text-slate-400 font-medium mb-1">{cat.label}</label>
                <RatingStepper
                  value={formData[`${cat.id}_rating`]}
                  onChange={(n) => handleChange(`${cat.id}_rating`, n)}
                />
              </div>
              <div className="md:col-span-3">
                <textarea
                  className="w-full bg-slate-950 p-2 rounded-lg border border-slate-700 h-20 min-h-[5rem] resize-y text-sm"
                  placeholder={`Минимум ${MIN_TEXT} символов о параметре: ${cat.label.toLowerCase()}`}
                  value={formData[`${cat.id}_text`]}
                  onChange={(e) => handleChange(`${cat.id}_text`, e.target.value)}
                  required
                />
                {/* Счётчик «сколько ещё символов нужно», пока текст слишком короткий */}
                {formData[`${cat.id}_text`].trim().length > 0 &&
                  formData[`${cat.id}_text`].trim().length < MIN_TEXT && (
                    <p className="text-xs text-amber-400 mt-1">
                      Ещё минимум {MIN_TEXT - formData[`${cat.id}_text`].trim().length} симв.
                    </p>
                  )}
              </div>
            </div>
          ))}

          {/* Общий вывод — отдельный блок с большим textarea */}
          <div className="pt-4">
            <label className="block text-white font-bold mb-2">Общий вывод (минимум {MIN_GENERAL} символов)</label>
            <textarea
              className="w-full bg-slate-950 p-4 rounded-lg border border-slate-700 h-32 min-h-[8rem] resize-y"
              value={formData.general_text}
              onChange={(e) => handleChange('general_text', e.target.value)}
              placeholder="Подведите общий итог вашей рецензии..."
              required
            />
            {formData.general_text.trim().length > 0 &&
              formData.general_text.trim().length < MIN_GENERAL && (
                <p className="text-xs text-amber-400 mt-1">
                  Ещё минимум {MIN_GENERAL - formData.general_text.trim().length} симв.
                </p>
              )}
          </div>

          <div className="flex gap-4">
            {/* Отмена — назад по истории */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition"
            >
              Отмена
            </button>
            {/* Кнопка заблокирована при отправке и пока форма невалидна */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Публикация...' : 'Опубликовать рецензию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
