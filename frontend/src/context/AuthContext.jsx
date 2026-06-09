import { createContext, useState, useContext, useEffect } from 'react';
import { getMe } from '@/api/users';
import { logout as logoutRequest } from '@/api/auth';

// =============================================================================
// Контекст авторизации: хранит текущего пользователя и методы входа/выхода.
//
//  - при старте, если в localStorage есть токен, подтягивает профиль (fetchMe);
//  - login сохраняет токены и грузит профиль; logout отзывает refresh-токен на
//    бэке, чистит localStorage и уводит на главную;
//  - loading=true, пока идёт первичная проверка токена (чтобы не мигал UI).
// Доступ к контексту — через хук useAuth().
// =============================================================================
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      setUser(await getMe());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    fetchMe();
  };

  const logout = async () => {
    // Отзываем refresh-токен на бэке (не блокируем выход при ошибке)
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch (err) {
        console.error('Не удалось отозвать токен на сервере:', err);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);