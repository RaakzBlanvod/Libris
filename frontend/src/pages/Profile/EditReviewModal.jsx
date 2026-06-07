import { useState, useEffect } from 'react';
import api from '../../api/client';

// Вынесен из тела модалки: компонент, объявленный внутри рендера,
// пересоздаётся на каждый ввод и теряет фокус/состояние.
function RatingInput({ label, field, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-slate-400 mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(field, val)}
            className={`w-7 py-1 rounded text-sm transition ${
              value === val
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EditReviewModal({ review, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    plot_rating: review.plot_rating || 1,
    characters_rating: review.characters_rating || 1,
    style_rating: review.style_rating || 1,
    pacing_rating: review.pacing_rating || 1,
    world_rating: review.world_rating || 1,
    plot_text: review.plot_text || '',
    characters_text: review.characters_text || '',
    style_text: review.style_text || '',
    pacing_text: review.pacing_text || '',
    world_text: review.world_text || '',
    general_text: review.general_text || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Закрытие по Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleRatingChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <h2 className="text-xl font-bold text-white mb-4">Редактировать рецензию</h2>

        {error && <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-lg text-sm">{error}</div>}

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <RatingInput label="📖 Сюжет" field="plot_rating" value={formData.plot_rating} onChange={handleRatingChange} />
            <RatingInput label="👥 Персонажи" field="characters_rating" value={formData.characters_rating} onChange={handleRatingChange} />
            <RatingInput label="✍️ Стиль" field="style_rating" value={formData.style_rating} onChange={handleRatingChange} />
            <RatingInput label="⚡ Темп" field="pacing_rating" value={formData.pacing_rating} onChange={handleRatingChange} />
            <RatingInput label="🌍 Мир" field="world_rating" value={formData.world_rating} onChange={handleRatingChange} />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Общее впечатление</label>
            <textarea
              value={formData.general_text}
              onChange={(e) => setFormData({...formData, general_text: e.target.value})}
              placeholder="Расскажите своё общее впечатление..."
              className="w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-700 focus:border-blue-600 outline-none h-20"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">О сюжете</label>
            <textarea
              value={formData.plot_text}
              onChange={(e) => setFormData({...formData, plot_text: e.target.value})}
              placeholder="Что вы думаете о сюжете?"
              className="w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-700 focus:border-blue-600 outline-none h-16"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">О персонажах</label>
            <textarea
              value={formData.characters_text}
              onChange={(e) => setFormData({...formData, characters_text: e.target.value})}
              placeholder="Как вам персонажи?"
              className="w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-700 focus:border-blue-600 outline-none h-16"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">О стиле</label>
            <textarea
              value={formData.style_text}
              onChange={(e) => setFormData({...formData, style_text: e.target.value})}
              placeholder="Что вы думаете о стиле автора?"
              className="w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-700 focus:border-blue-600 outline-none h-16"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">О темпе</label>
            <textarea
              value={formData.pacing_text}
              onChange={(e) => setFormData({...formData, pacing_text: e.target.value})}
              placeholder="Как вам темп повествования?"
              className="w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-700 focus:border-blue-600 outline-none h-16"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">О мире</label>
            <textarea
              value={formData.world_text}
              onChange={(e) => setFormData({...formData, world_text: e.target.value})}
              placeholder="Как вам построен мир?"
              className="w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-700 focus:border-blue-600 outline-none h-16"
            />
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
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}
