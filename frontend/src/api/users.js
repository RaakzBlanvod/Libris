import api from './client';

// =============================================================================
// API профиля текущего пользователя (/api/v1/users/me*).
// =============================================================================

// Профиль текущего пользователя (с расширенной статистикой).
export const getMe = () => api.get('/api/v1/users/me').then((r) => r.data);

// Частичное обновление профиля (username, bio, favorite_genres).
export const updateMe = (data) =>
  api.patch('/api/v1/users/me', data).then((r) => r.data);

// Загрузка аватара (multipart, поле `file`).
export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post('/api/v1/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};

// Удаление аккаунта (необратимо).
export const deleteMe = () => api.delete('/api/v1/users/me');
