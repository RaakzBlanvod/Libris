import { useState } from 'react';

// =============================================================================
// Аватар пользователя с устойчивым фолбэком.
//
// Логика: если есть URL аватара и он загрузился — показываем картинку; если
// аватара нет ИЛИ картинка не загрузилась (onError) — рисуем кружок с
// инициалами. Это важно: на проде/Render аватар может быть недоступен (404),
// и без onError-фолбэка вместо него показывалась бы «битая картинка».
// =============================================================================

// Инициалы из имени (до 2 букв). Если имени нет — эмодзи-заглушка.
export const getInitials = (username) => {
  return username
    ?.split(' ')
    ?.map(word => word[0])
    ?.join('')
    ?.toUpperCase()
    ?.slice(0, 2) || '👤';
};

export const AvatarCircle = ({ avatar, username, size = 'md' }) => {
  const [imageError, setImageError] = useState(!avatar);

  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-32 h-32 text-2xl'
  }[size];

  if (avatar && !imageError) {
    return (
      <img
        src={avatar}
        alt={username}
        className={`${sizeClass} rounded-full bg-slate-800 object-cover border border-slate-700`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center font-bold text-white border border-slate-700`}>
      {getInitials(username)}
    </div>
  );
};

