import { useState } from 'react';

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

