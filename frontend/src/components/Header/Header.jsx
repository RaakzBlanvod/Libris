import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BookOpen, Bookmark, MessageSquare, Home, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AvatarCircle } from '@/components/Avatar/Avatar';

// =============================================================================
// Шапка сайта: логотип, навигация и кнопка аккаунта (sticky сверху).
//
// На десктопе навигация в строку; на мобильных — бургер-меню (menuOpen).
// Кнопка справа зависит от авторизации: «Войти» для гостя или аватар+ник со
// ссылкой на профиль для залогиненного (берём из useAuth).
// =============================================================================
const NAV_ITEMS = [
  { to: '/', label: 'Главная', icon: Home, end: true },
  { to: '/reviews', label: 'Рецензии', icon: MessageSquare },
  { to: '/bookmarks', label: 'Библиотека', icon: Bookmark },
];

const desktopLinkClass = ({ isActive }) =>
  `flex items-center gap-2 text-sm font-medium transition ${
    isActive ? 'text-white' : 'text-slate-300 hover:text-white'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
  }`;

export default function Header() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Кнопка профиля/входа — без изменений, общая для десктопа и мобильной шапки
  const accountButton = user ? (
    <Link
      to="/profile"
      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-full transition border border-slate-800"
    >
      <AvatarCircle avatar={user.avatar} username={user.username} size="sm" />
      <span className="text-sm font-medium text-slate-200">
        {user.username || 'Профиль'}
      </span>
    </Link>
  ) : (
    <Link
      to="/login"
      className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
    >
      Войти
    </Link>
  );

  return (
    <header className="bg-slate-950 text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Логотип */}
        <Link to="/" className="flex items-center gap-2 text-xl font-black text-indigo-400 hover:text-indigo-300 transition">
          <BookOpen size={24} />
          LIBRIS
        </Link>

        <div className="flex items-center gap-6">
          {/* Десктоп-навигация */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={desktopLinkClass}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          {accountButton}

          {/* Бургер — только на мобильных */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden text-slate-300 hover:text-white p-1"
            aria-label="Меню навигации"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Выпадающее меню на мобильных */}
      {menuOpen && (
        <nav className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={mobileLinkClass}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
