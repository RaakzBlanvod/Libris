import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4">
      <div className="text-7xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Страница не найдена</h1>
      <p className="text-slate-400 mb-8 max-w-md">
        Похоже, такой страницы не существует или она была перемещена.
      </p>
      <Link
        to="/"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-blue-900/20"
      >
        На главную
      </Link>
    </div>
  );
}
