import api from './client';

// =============================================================================
// API авторизации (/api/v1/auth/*). Эндпоинты собраны здесь, а не размазаны
// по страницам.
// =============================================================================

// Вход. На бэке это OAuth2-форма, поэтому шлём multipart/form-data, а поле
// называется `username`, хотя кладём туда email. Возвращает пару токенов.
export const login = (email, password) => {
  const form = new FormData();
  form.append('username', email);
  form.append('password', password);
  return api
    .post('/api/v1/auth/login', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};

// Регистрация (обычный JSON: { email, username, password }).
export const register = (data) =>
  api.post('/api/v1/auth/register', data).then((r) => r.data);

// Отзыв refresh-токена на бэке (logout).
export const logout = (refresh_token) =>
  api.post('/api/v1/auth/logout', { refresh_token });
