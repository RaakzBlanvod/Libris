import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AvatarCircle } from '../../components/Avatar/Avatar';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import EditProfileModal from './EditProfileModal';
import ReviewsTab from './ReviewsTab';
import BookmarksTab from './BookmarksTab';
import ProfileStats from './ProfileStats';

export default function ProfilePage() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showEditModal, setShowEditModal] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  if (!auth) return <div className="min-h-screen bg-slate-950 text-center py-20 text-slate-500">Система авторизации недоступна.</div>;

  const { user, logout, loading, setUser } = auth;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 max-w-4xl mx-auto px-4 py-20 text-center flex flex-col justify-center items-center">
        <h2 className="text-3xl font-extrabold text-white mb-4">Доступ закрыт</h2>
        <p className="text-slate-400 mb-8 max-w-md text-lg">
          Войдите в систему или создайте аккаунт, чтобы просматривать свой профиль, личную статистику и любимые жанры.
        </p>
        <Link
          to="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-blue-900/20"
        >
          Войти или Зарегистрироваться
        </Link>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    const res = await api.get('/api/v1/users/me');
    setUser(res.data);
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Удалить аккаунт',
      message: 'Это действие необратимо. Все ваши данные будут стёрты. Вы уверены?',
      confirmText: 'Удалить аккаунт',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete('/api/v1/users/me');
      logout();
    } catch {
      toast.error('Ошибка при удалении аккаунта');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 w-full text-slate-200">
      <div className="max-w-4xl mx-auto">
        {/* Шапка профиля */}
        <div className="bg-slate-900 rounded-3xl shadow-sm border border-slate-800 overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-emerald-600"></div>

          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <AvatarCircle avatar={user?.avatar} username={user?.username} size="lg" />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition text-sm"
                >
                  Редактировать
                </button>
                <button
                  onClick={logout}
                  className="bg-slate-800 hover:bg-red-900/30 hover:text-red-400 text-slate-400 px-4 py-2 rounded-xl font-bold transition text-sm"
                >
                  Выйти
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">{user?.username || 'Без имени'}</h1>
              <p className="text-slate-400 max-w-lg leading-relaxed">
                {user?.bio || 'Биография еще не заполнена. Расскажите о своих книжных вкусах!'}
              </p>
            </div>

            <div className="flex gap-8 mt-8 py-6 border-y border-slate-800">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-blue-400">{user?.read_books_count || 0}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Прочитано</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-blue-400">{user?.reviews_count || 0}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Рецензий</div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-white mb-4 text-lg">Любимые жанры</h3>
              <div className="flex flex-wrap gap-2">
                {user?.favorite_genres?.length > 0 ? (
                  user.favorite_genres.map(genre => (
                    <span key={genre} className="bg-slate-800 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium border border-slate-700">
                      {genre}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
                    Жанры не выбраны
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="bg-slate-900 rounded-3xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="flex border-b border-slate-800">
            {['profile', 'reviews', 'bookmarks'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-4 font-semibold transition ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'profile' && 'Профиль'}
                {tab === 'reviews' && 'Мои рецензии'}
                {tab === 'bookmarks' && 'Закладки'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <ProfileStats />
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                  <h3 className="text-red-400 font-bold mb-2">Опасная зона</h3>
                  <p className="text-slate-400 text-sm mb-4">Удаление аккаунта необратимо. Все ваши данные будут стерты.</p>
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition text-sm"
                  >
                    Удалить аккаунт
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'reviews' && <ReviewsTab />}
            {activeTab === 'bookmarks' && <BookmarksTab />}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
}
