import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const categories = [
  { id: 'plot', label: 'Сюжет' },
  { id: 'characters', label: 'Персонажи' },
  { id: 'style', label: 'Атмосфера и стиль' },
  { id: 'pacing', label: 'Темп и динамика' },
  { id: 'world', label: 'Мироустройство' },
];

// Минимальные длины из схем бэка (ReviewBase)
const MIN_TEXT = 10;
const MIN_GENERAL = 20;

export default function CreateReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    plot_rating: 5, plot_text: '',
    characters_rating: 5, characters_text: '',
    style_rating: 5, style_text: '',
    pacing_rating: 5, pacing_text: '',
    world_rating: 5, world_text: '',
    general_text: ''
  });

  // Гостя на страницу создания рецензии не пускаем
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/v1/books/${id}`)
      .then(res => setBook(res.data))
      .catch(err => console.error("Ошибка загрузки книги:", err));
  }, [id]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Валидация минимальных длин до отправки (чтобы не ловить 400 с бэка)
  const missingCriteria = categories.filter(
    (cat) => formData[`${cat.id}_text`].trim().length < MIN_TEXT
  );
  const generalTooShort = formData.general_text.trim().length < MIN_GENERAL;
  const isValid = missingCriteria.length === 0 && !generalTooShort;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!book || !book.id) {
      toast.error("Данные книги ещё не загрузились. Попробуйте снова через секунду.");
      return;
    }

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
      await api.post(`/api/v1/reviews/book/${book.id}`, formData);
      toast.success("Рецензия успешно опубликована!");
      navigate(`/books/${id}`);
    } catch (err) {
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

  if (!book) return <div className="text-white text-center p-20">Загрузка данных книги...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Рецензия на книгу</h1>
        <p className="text-indigo-400 mb-8 font-semibold text-lg">{book.title}</p>

        <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6">
          {categories.map((cat) => (
            <div key={cat.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-800 pb-4">
              <div className="md:col-span-1">
                <label className="block text-slate-400 font-medium mb-1">{cat.label}</label>
                <input
                  type="number" min="1" max="10"
                  value={formData[`${cat.id}_rating`]}
                  onChange={(e) => handleChange(`${cat.id}_rating`, parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-slate-950 p-2 rounded-lg border border-slate-700 text-white text-center"
                />
              </div>
              <div className="md:col-span-3">
                <textarea
                  className="w-full bg-slate-950 p-2 rounded-lg border border-slate-700 h-20 text-sm"
                  placeholder={`Минимум 10 символов о параметре: ${cat.label.toLowerCase()}`}
                  value={formData[`${cat.id}_text`]}
                  onChange={(e) => handleChange(`${cat.id}_text`, e.target.value)}
                  required
                />
                {formData[`${cat.id}_text`].trim().length > 0 &&
                  formData[`${cat.id}_text`].trim().length < MIN_TEXT && (
                    <p className="text-xs text-amber-400 mt-1">
                      Ещё минимум {MIN_TEXT - formData[`${cat.id}_text`].trim().length} симв.
                    </p>
                  )}
              </div>
            </div>
          ))}

          <div className="pt-4">
            <label className="block text-white font-bold mb-2">Общий вывод (Минимум 20 символов)</label>
            <textarea
              className="w-full bg-slate-950 p-4 rounded-lg border border-slate-700 h-32"
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
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition"
            >
              Отмена
            </button>
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