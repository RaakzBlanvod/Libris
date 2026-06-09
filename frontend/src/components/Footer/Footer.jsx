import { Link } from 'react-router-dom';

// =============================================================================
// Подвал сайта: копирайт + ссылки на «Условия использования» и «API Docs».
// =============================================================================

// Swagger бэкенда живёт по /docs на самом backend (не под /api), поэтому это
// внешняя ссылка. Адрес можно переопределить через env (VITE_API_DOCS_URL);
// дефолт — прод-бэкенд на Render, чтобы ссылка работала на Vercel (где .env не
// деплоится). Для локальной разработки localhost задаётся в frontend/.env.
const API_DOCS_URL =
  import.meta.env.VITE_API_DOCS_URL || 'https://libris-backend-ke58.onrender.com/docs';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-500 text-sm py-6 mt-auto border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>© {new Date().getFullYear()} Libris Project. Все права защищены.</div>
        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-slate-300 transition">
            Условия использования
          </Link>
          <a
            href={API_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition"
          >
            API Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
