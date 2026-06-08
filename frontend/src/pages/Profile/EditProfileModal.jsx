import { useState } from 'react';
import api from '../../api/client';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// =============================================================================
// Модалка редактирования профиля (имя, биография, любимые жанры, аватар).
//
// Жанры в форме хранятся одной строкой «через запятую» — на бэк уходят массивом.
// Профиль и аватар сохраняются разными запросами: PATCH /users/me (текстовые
// поля) и POST /users/me/avatar (файл, multipart) — только если файл выбран.
// =============================================================================
export default function EditProfileModal({ user, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    username: user.username,
    bio: user.bio || '',
    // массив жанров → строка для текстового поля
    favorite_genres: user.favorite_genres?.join(', ') || ''
  });
  const [avatarFile, setAvatarFile] = useState(null); // выбранный файл аватара
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Закрытие по Escape (общий хук вместо ручного слушателя).
  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Строку «Фантастика, Детектив» превращаем в массив без пустых элементов.
      const genres = formData.favorite_genres
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await api.patch('/api/v1/users/me', {
        username: formData.username,
        bio: formData.bio,
        favorite_genres: genres
      });

      // Аватар грузим отдельным multipart-запросом — только если выбрали файл.
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', avatarFile);
        await api.post('/api/v1/users/me/avatar', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      onUpdate(); // родитель перезапросит профиль
      onClose();
    } catch (err) {
      // Бэк отдаёт массив ошибок валидации — показываем первую.
      setError(err.response?.data?.detail?.[0]?.msg || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Редактировать профиль</h2>

        {error && <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-lg text-sm">{error}</div>}

        <label className="block text-sm text-slate-400 mb-2">Аватар</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files[0])}
          className="mb-4 text-sm text-slate-300 w-full"
        />

        <label className="block text-sm text-slate-400 mb-2">Имя пользователя</label>
        <input
          type="text"
          placeholder="Имя пользователя"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          className="w-full bg-slate-800 p-3 rounded-xl text-white mb-4 border border-slate-700 focus:border-blue-600 outline-none"
        />

        <label className="block text-sm text-slate-400 mb-2">Биография</label>
        <textarea
          placeholder="Расскажите о себе..."
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          className="w-full bg-slate-800 p-3 rounded-xl text-white mb-4 h-24 border border-slate-700 focus:border-blue-600 outline-none"
        />

        <label className="block text-sm text-slate-400 mb-2">Любимые жанры (через запятую)</label>
        <input
          type="text"
          placeholder="Фантастика, Детектив, Приключения"
          value={formData.favorite_genres}
          onChange={(e) => setFormData({...formData, favorite_genres: e.target.value})}
          className="w-full bg-slate-800 p-3 rounded-xl text-white mb-4 border border-slate-700 focus:border-blue-600 outline-none"
        />

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