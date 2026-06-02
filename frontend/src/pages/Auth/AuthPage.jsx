import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const bodyFormData = new FormData();
        bodyFormData.append('username', formData.email);
        bodyFormData.append('password', formData.password);

        const res = await api.post('/api/v1/auth/login', bodyFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        login(res.data.access_token, res.data.refresh_token);
        navigate('/profile');
      } else {
        await api.post('/api/v1/auth/register', {
          email: formData.email,
          username: formData.username,
          password: formData.password
        });

        toast.success('Регистрация прошла успешно! Теперь войдите.');
        setIsLogin(true);
      }
    } catch (err) {
      if (err.response?.status === 422) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          setError(`Ошибка в поле ${detail[0].loc[1]}: ${detail[0].msg}`);
        } else {
          setError('Ошибка валидации данных.');
        }
      } else {
        setError(err.response?.data?.detail || 'Неверные данные или сервер недоступен');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-800">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {isLogin ? 'Вход в аккаунт' : 'Создать аккаунт'}
        </h2>

        {error && (
          <div className="bg-red-900/30 text-red-400 p-3 rounded-lg mb-4 text-sm font-medium border border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Имя пользователя</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Пароль</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400 text-sm">
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 font-bold ml-1 hover:underline"
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  );
}
