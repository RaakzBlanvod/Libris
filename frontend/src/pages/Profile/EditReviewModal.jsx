import { useState } from 'react';
import api from '../../api/client';
import { REVIEW_CATEGORIES, MIN_TEXT, MIN_GENERAL } from '../../constants/reviews';
import RatingStepper from '../../components/RatingStepper/RatingStepper';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// =============================================================================
// Модалка редактирования существующей рецензии.
//
// Открывается из «Мои рецензии» (профиль), со страницы книги и т.п. Layout
// повторяет страницу создания: 5 критериев (оценка-степпер + текст) + общий
// вывод, с той же клиентской валидацией минимальных длин (MIN_TEXT/MIN_GENERAL,
// зеркалят схему ReviewUpdate на бэке). Сохранение — PATCH /reviews/{id}.
// onUpdate вызывается после успешного сохранения (родитель перезагружает данные).
// =============================================================================
export default function EditReviewModal({ review, onClose, onUpdate }) {
  // Инициализируем форму текущими значениями рецензии (оценки — с фолбэком 5).
  const [formData, setFormData] = useState({
    plot_rating: review.plot_rating || 5,
    characters_rating: review.characters_rating || 5,
    style_rating: review.style_rating || 5,
    pacing_rating: review.pacing_rating || 5,
    world_rating: review.world_rating || 5,
    plot_text: review.plot_text || '',
    characters_text: review.characters_text || '',
    style_text: review.style_text || '',
    pacing_text: review.pacing_text || '',
    world_text: review.world_text || '',
    general_text: review.general_text || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Закрытие по Escape (общий хук вместо ручного слушателя).
  useEscapeKey(onClose);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Валидация минимальных длин (как на бэке), чтобы не ловить 400.
  const missingCriteria = REVIEW_CATEGORIES.filter(
    (cat) => formData[`${cat.id}_text`].trim().length < MIN_TEXT
  );
  const generalTooShort = formData.general_text.trim().length < MIN_GENERAL;
  const isValid = missingCriteria.length === 0 && !generalTooShort;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');

    try {
      await api.patch(`/api/v1/reviews/${review.id}`, formData);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.detail?.[0]?.msg || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-3xl shadow-2xl my-8"
      >
        <h2 className="text-xl font-bold text-white mb-6">Редактировать рецензию</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-lg text-sm border border-red-800">
            {error}
          </div>
        )}

        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
          {REVIEW_CATEGORIES.map((cat) => {
            const text = formData[`${cat.id}_text`];
            const tooShort = text.trim().length > 0 && text.trim().length < MIN_TEXT;
            return (
              <div
                key={cat.id}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-800 pb-4"
              >
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
                    value={text}
                    onChange={(e) => handleChange(`${cat.id}_text`, e.target.value)}
                    required
                  />
                  {tooShort && (
                    <p className="text-xs text-amber-400 mt-1">
                      Ещё минимум {MIN_TEXT - text.trim().length} симв.
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-1">
            <label className="block text-white font-bold mb-2">
              Общий вывод (минимум {MIN_GENERAL} символов)
            </label>
            <textarea
              className="w-full bg-slate-950 p-4 rounded-lg border border-slate-700 h-32 min-h-[8rem] resize-y"
              value={formData.general_text}
              onChange={(e) => handleChange('general_text', e.target.value)}
              placeholder="Подведите общий итог вашей рецензии..."
              required
            />
            {formData.general_text.trim().length > 0 && generalTooShort && (
              <p className="text-xs text-amber-400 mt-1">
                Ещё минимум {MIN_GENERAL - formData.general_text.trim().length} симв.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-300 px-4 py-2 rounded-xl transition"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}
