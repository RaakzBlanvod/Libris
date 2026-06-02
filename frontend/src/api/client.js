import axios from 'axios';

export const api = axios.create({
  baseURL: '/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Авто-обновление access-токена при 401 ---
// Один общий промис на refresh, чтобы параллельные 401 не запускали несколько обновлений.
let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('Нет refresh-токена');

  // Отдельный экземпляр axios без интерцепторов, чтобы не зациклиться.
  const res = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
  localStorage.setItem('access_token', res.data.access_token);
  localStorage.setItem('refresh_token', res.data.refresh_token);
  return res.data.access_token;
};

const forceLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    // Не трогаем сами auth-запросы и уже повторённые запросы.
    const isAuthCall = url.includes('/api/v1/auth/');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        // Объединяем одновременные обновления в один запрос.
        refreshPromise = refreshPromise || refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        refreshPromise = null;
        forceLogout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
